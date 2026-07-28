import pytest
import json
from app.services.policy_engine.builder import PolicyBuilderService
from app.models.grid_models import Policy, PolicyVersion

class MockDbQuery:
    def __init__(self, result_list=None):
        self.result_list = result_list or []
        self.single_result = result_list[0] if result_list else None

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def first(self):
        return self.single_result

    def all(self):
        return self.result_list

class MockDbSession:
    def __init__(self):
        self.added = []
        self.flushed = False
        self.committed = False

    def query(self, model):
        if model == PolicyVersion:
            # Return list of two mock versions for len(latest) checks
            return MockDbQuery([
                PolicyVersion(id=1, version="v1.0.0"),
                PolicyVersion(id=2, version="v2.0.0")
            ])
        return MockDbQuery()

    def add(self, instance):
        self.added.append(instance)

    def flush(self):
        self.flushed = True

    def commit(self):
        self.committed = True

def test_clone_policy():
    """Verify policy cloning replicates attributes and sets status to draft."""
    db = MockDbSession()
    service = PolicyBuilderService(db)
    
    # Mock source policy
    source = Policy(
        id=10,
        name="Reliability Mode",
        description="Priority stability optimization.",
        organization_id=1,
        created_by=2,
        priority=4,
        objective="MAX_RELIABILITY",
        weights={"cost": 0.05, "stability": 0.50},
        constraints={"voltage_deviation_pct": 2.0},
        expected_outcome="Maximum stability margins."
    )
    
    # Override policy_repo.get to return source
    service.policy_repo.get = lambda pid: source if pid == 10 else None
    
    cloned = service.clone_policy(10, user_id=3)
    
    assert cloned.name == "Copy of Reliability Mode"
    assert cloned.status == "draft"
    assert cloned.is_active is False
    assert cloned.priority == 4
    assert cloned.objective == "MAX_RELIABILITY"
    assert cloned.weights == {"cost": 0.05, "stability": 0.50}
    assert cloned.constraints == {"voltage_deviation_pct": 2.0}
    assert cloned.created_by == 3
    assert db.flushed is True
    assert db.committed is True
    
    # Check that a PolicyVersion was created
    version_rec = next((x for x in db.added if isinstance(x, PolicyVersion)), None)
    assert version_rec is not None
    assert version_rec.version == "v1.0.0"
    
    parsed = json.loads(version_rec.code_content)
    assert parsed["changelog"] == "Initial cloned draft version."

def test_create_new_version():
    """Verify version increment matches latest registered index."""
    db = MockDbSession()
    service = PolicyBuilderService(db)
    
    policy = Policy(id=15, name="Draft Mode", weights={"cost": 0.5}, constraints={})
    service.policy_repo.get = lambda pid: policy if pid == 15 else None
    
    new_v = service.create_new_version(15, changelog="Updated weights details.", user_id=3)
    
    # Our mock query returns 2 existing versions, so length is 2 and next should be 3
    assert new_v.version == "v3.0.0"
    assert new_v.policy_id == 15
    parsed = json.loads(new_v.code_content)
    assert parsed["changelog"] == "Updated weights details."

def test_rollback_to_version():
    """Verify that rollback overwrites active weights and constraints from version json."""
    db = MockDbSession()
    service = PolicyBuilderService(db)
    
    policy = Policy(
        id=20, 
        name="Adjustable Mode", 
        weights={"cost": 0.5, "stability": 0.5},
        constraints={"min_soc_pct": 20.0}
    )
    service.policy_repo.get = lambda pid: policy if pid == 20 else None
    
    target_version = PolicyVersion(
        id=4,
        policy_id=20,
        version="v1.0.0",
        code_content=json.dumps({
            "weights": {"cost": 0.2, "stability": 0.8},
            "constraints": {"min_soc_pct": 30.0},
            "changelog": "Old settings."
        })
    )
    
    # Mock query to return target_version when searching by id
    def mock_query(model):
        if model == PolicyVersion:
            class MockVerQuery:
                def filter(self, *args, **kwargs):
                    return self
                def first(self):
                    return target_version
                def all(self):
                    return [target_version] # Length is 1, so rollback ver is v2.0.0
            return MockVerQuery()
        return MockDbQuery()
        
    db.query = mock_query
    
    updated_policy = service.rollback_to_version(20, version_id=4, user_id=3)
    
    assert updated_policy.weights == {"cost": 0.2, "stability": 0.8}
    assert updated_policy.constraints == {"min_soc_pct": 30.0}
    
    # Verify new tracking version was committed
    version_rec = next((x for x in db.added if isinstance(x, PolicyVersion) and x.version == "v2.0.0"), None)
    assert version_rec is not None
    parsed = json.loads(version_rec.code_content)
    assert "Rolled back" in parsed["changelog"]

def test_export_import_policies():
    """Verify portability format packing and parsing draft conversions."""
    db = MockDbSession()
    service = PolicyBuilderService(db)
    
    policy = Policy(
        id=25,
        name="Exportable Mode",
        description="Backup settings.",
        priority=2,
        objective="BALANCED",
        weights={"cost": 0.25, "carbon": 0.75},
        constraints={"min_soc_pct": 25.0},
        expected_outcome="Outcome text.",
        ai_explanation="Explanation.",
        affected_systems=["Optimization"]
    )
    service.policy_repo.get = lambda pid: policy if pid == 25 else None
    
    exported = service.export_policy(25)
    assert exported["name"] == "Exportable Mode"
    assert exported["weights"]["carbon"] == 0.75
    
    # Import
    imported = service.import_policy(exported, org_id=1, user_id=4)
    assert imported.status == "draft"
    assert imported.weights == {"cost": 0.25, "carbon": 0.75}
    assert imported.constraints == {"min_soc_pct": 25.0}
    assert imported.created_by == 4
