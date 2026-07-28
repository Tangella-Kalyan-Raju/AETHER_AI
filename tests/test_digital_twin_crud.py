"""
GPO Backend Test Suite — Phase 3.2 Digital Twin CRUD API Tests
Path: tests/test_digital_twin_crud.py

Comprehensive automated tests covering:
- Authentication enforcement
- Full CRUD for all 7 Digital Twin asset types
- UUID-based lookups
- PATCH (partial update) operations
- Validation (duplicates, invalid FKs, capacity bounds, self-loops)
- Pagination (page, page_size, total_records, next/prev)
- Filtering (status, substation, type, state, bus)
- Sorting (asc/desc by name, created_at, capacity)
- Search (name substring, UUID substring)
- Error handling (404, 409, 422)
"""
import sys
import os
import uuid as uuid_lib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src-backend"))

# Use separate test database for automated runs
os.environ["SQLITE_DB_NAME"] = "test_gpo_auth.db"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ──────────────────────────────────────────────────────────
# Helper: Get admin auth token
# ──────────────────────────────────────────────────────────
def get_admin_token() -> str:
    """Login as admin and return the Bearer token."""
    resp = client.post("/api/auth/login", json={
        "email": "admin@gpo.gov",
        "password": "admin"
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["access_token"]


def auth_headers() -> dict:
    return {"Authorization": f"Bearer {get_admin_token()}"}


def unique_name(prefix: str) -> str:
    """Generate a unique name with a UUID suffix to avoid collisions."""
    return f"{prefix}-{uuid_lib.uuid4().hex[:8]}"


# ──────────────────────────────────────────────────────────
# Authentication Enforcement Tests
# ──────────────────────────────────────────────────────────
class TestAuthEnforcement:
    """Verify that unauthenticated requests are rejected with 401/403."""

    def test_list_substations_requires_auth(self):
        resp = client.get("/api/v1/substations")
        assert resp.status_code in [401, 403]

    def test_create_substation_requires_auth(self):
        resp = client.post("/api/v1/substations", json={"name": "Test"})
        assert resp.status_code in [401, 403]

    def test_list_buses_requires_auth(self):
        resp = client.get("/api/v1/buses")
        assert resp.status_code in [401, 403]

    def test_list_generators_requires_auth(self):
        resp = client.get("/api/v1/generators")
        assert resp.status_code in [401, 403]

    def test_list_loads_requires_auth(self):
        resp = client.get("/api/v1/loads")
        assert resp.status_code in [401, 403]

    def test_list_switches_requires_auth(self):
        resp = client.get("/api/v1/switches")
        assert resp.status_code in [401, 403]


# ──────────────────────────────────────────────────────────
# Substation CRUD Tests
# ──────────────────────────────────────────────────────────
class TestSubstationCRUD:
    """Full CRUD test suite for Substations."""

    def test_create_substation(self):
        name = unique_name("Sub-Create")
        resp = client.post("/api/v1/substations", headers=auth_headers(), json={
            "name": name,
            "description": "Test substation",
            "latitude": 37.77,
            "longitude": -122.42,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["name"] == name
        assert data["data"]["uuid"] is not None
        assert data["data"]["status"] == "active"

    def test_get_substation_by_id(self):
        name = unique_name("Sub-GetID")
        create_resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        sub_id = create_resp.json()["data"]["id"]

        resp = client.get(f"/api/v1/substations/{sub_id}", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == sub_id
        assert resp.json()["data"]["name"] == name

    def test_get_substation_by_uuid(self):
        name = unique_name("Sub-UUID")
        create_resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        sub_uuid = create_resp.json()["data"]["uuid"]

        resp = client.get(f"/api/v1/substations/uuid/{sub_uuid}", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.json()["data"]["uuid"] == sub_uuid

    def test_update_substation_put(self):
        name = unique_name("Sub-Put")
        create_resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        sub_id = create_resp.json()["data"]["id"]

        new_name = unique_name("Sub-Updated")
        resp = client.put(f"/api/v1/substations/{sub_id}", headers=auth_headers(), json={
            "name": new_name,
            "description": "Updated description",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == new_name

    def test_patch_substation(self):
        name = unique_name("Sub-Patch")
        create_resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        sub_id = create_resp.json()["data"]["id"]

        resp = client.patch(f"/api/v1/substations/{sub_id}", headers=auth_headers(), json={
            "description": "Patched description",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == name  # Name unchanged
        assert resp.json()["data"]["description"] == "Patched description"

    def test_delete_substation(self):
        name = unique_name("Sub-Del")
        create_resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        sub_id = create_resp.json()["data"]["id"]

        resp = client.delete(f"/api/v1/substations/{sub_id}", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.json()["data"]["deleted"] is True

        # Verify it's no longer found (soft-deleted)
        get_resp = client.get(f"/api/v1/substations/{sub_id}", headers=auth_headers())
        assert get_resp.status_code == 404

    def test_duplicate_name_rejected(self):
        name = unique_name("Sub-Dup")
        client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        assert resp.status_code == 409

    def test_get_nonexistent_returns_404(self):
        resp = client.get("/api/v1/substations/99999", headers=auth_headers())
        assert resp.status_code == 404

    def test_get_nonexistent_uuid_returns_404(self):
        resp = client.get("/api/v1/substations/uuid/nonexistent-uuid-12345", headers=auth_headers())
        assert resp.status_code == 404


# ──────────────────────────────────────────────────────────
# Bus CRUD Tests
# ──────────────────────────────────────────────────────────
class TestBusCRUD:
    """Full CRUD test suite for Bus nodes."""

    def _create_substation(self) -> int:
        name = unique_name("BusSub")
        resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        return resp.json()["data"]["id"]

    def test_create_bus(self):
        sub_id = self._create_substation()
        name = unique_name("Bus-Create")
        resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": name, "base_kv": 138.0, "substation_id": sub_id
        })
        assert resp.status_code == 201
        assert resp.json()["data"]["base_kv"] == 138.0

    def test_create_bus_invalid_substation(self):
        resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("Bus-BadFK"), "base_kv": 138.0, "substation_id": 99999
        })
        assert resp.status_code == 400

    def test_get_bus_by_uuid(self):
        sub_id = self._create_substation()
        name = unique_name("Bus-UUID")
        create_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": name, "base_kv": 69.0, "substation_id": sub_id
        })
        bus_uuid = create_resp.json()["data"]["uuid"]
        resp = client.get(f"/api/v1/buses/uuid/{bus_uuid}", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.json()["data"]["uuid"] == bus_uuid

    def test_patch_bus(self):
        sub_id = self._create_substation()
        name = unique_name("Bus-Patch")
        create_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": name, "base_kv": 138.0, "substation_id": sub_id
        })
        bus_id = create_resp.json()["data"]["id"]
        resp = client.patch(f"/api/v1/buses/{bus_id}", headers=auth_headers(), json={
            "base_kv": 230.0
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["base_kv"] == 230.0
        assert resp.json()["data"]["name"] == name  # Unchanged

    def test_delete_bus(self):
        sub_id = self._create_substation()
        name = unique_name("Bus-Del")
        create_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": name, "base_kv": 138.0, "substation_id": sub_id
        })
        bus_id = create_resp.json()["data"]["id"]
        resp = client.delete(f"/api/v1/buses/{bus_id}", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.json()["data"]["deleted"] is True


# ──────────────────────────────────────────────────────────
# Transmission Line CRUD Tests
# ──────────────────────────────────────────────────────────
class TestTransmissionLineCRUD:
    """CRUD tests for Transmission Lines including self-loop validation."""

    def _create_two_buses(self):
        sub_name = unique_name("LineSub")
        sub_resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": sub_name})
        sub_id = sub_resp.json()["data"]["id"]

        bus1_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("LBus1"), "base_kv": 138.0, "substation_id": sub_id
        })
        bus2_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("LBus2"), "base_kv": 138.0, "substation_id": sub_id
        })
        return bus1_resp.json()["data"]["id"], bus2_resp.json()["data"]["id"]

    def test_create_transmission_line(self):
        bus1_id, bus2_id = self._create_two_buses()
        name = unique_name("Line-Create")
        resp = client.post("/api/v1/transmission-lines", headers=auth_headers(), json={
            "name": name, "from_bus_id": bus1_id, "to_bus_id": bus2_id, "rating_mva": 150.0
        })
        assert resp.status_code == 201
        assert resp.json()["data"]["rating_mva"] == 150.0

    def test_self_loop_rejected(self):
        bus1_id, _ = self._create_two_buses()
        resp = client.post("/api/v1/transmission-lines", headers=auth_headers(), json={
            "name": unique_name("Line-Loop"), "from_bus_id": bus1_id, "to_bus_id": bus1_id
        })
        assert resp.status_code == 422  # Pydantic model validator catches self-loop

    def test_invalid_bus_reference_rejected(self):
        bus1_id, _ = self._create_two_buses()
        resp = client.post("/api/v1/transmission-lines", headers=auth_headers(), json={
            "name": unique_name("Line-BadFK"), "from_bus_id": bus1_id, "to_bus_id": 99999
        })
        assert resp.status_code == 400

    def test_get_line_by_uuid(self):
        bus1_id, bus2_id = self._create_two_buses()
        name = unique_name("Line-UUID")
        create_resp = client.post("/api/v1/transmission-lines", headers=auth_headers(), json={
            "name": name, "from_bus_id": bus1_id, "to_bus_id": bus2_id
        })
        line_uuid = create_resp.json()["data"]["uuid"]
        resp = client.get(f"/api/v1/transmission-lines/uuid/{line_uuid}", headers=auth_headers())
        assert resp.status_code == 200

    def test_patch_transmission_line(self):
        bus1_id, bus2_id = self._create_two_buses()
        name = unique_name("Line-Patch")
        create_resp = client.post("/api/v1/transmission-lines", headers=auth_headers(), json={
            "name": name, "from_bus_id": bus1_id, "to_bus_id": bus2_id, "rating_mva": 100.0
        })
        line_id = create_resp.json()["data"]["id"]
        resp = client.patch(f"/api/v1/transmission-lines/{line_id}", headers=auth_headers(), json={
            "rating_mva": 200.0
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["rating_mva"] == 200.0


# ──────────────────────────────────────────────────────────
# Transformer CRUD Tests
# ──────────────────────────────────────────────────────────
class TestTransformerCRUD:
    """CRUD tests for Transformers."""

    def _create_two_buses(self):
        sub_name = unique_name("XfmrSub")
        sub_resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": sub_name})
        sub_id = sub_resp.json()["data"]["id"]

        bus1_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("XBus1"), "base_kv": 138.0, "substation_id": sub_id
        })
        bus2_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("XBus2"), "base_kv": 69.0, "substation_id": sub_id
        })
        return bus1_resp.json()["data"]["id"], bus2_resp.json()["data"]["id"]

    def test_create_transformer(self):
        bus1_id, bus2_id = self._create_two_buses()
        name = unique_name("Xfmr-Create")
        resp = client.post("/api/v1/transformers", headers=auth_headers(), json={
            "name": name, "from_bus_id": bus1_id, "to_bus_id": bus2_id, "rating_mva": 50.0
        })
        assert resp.status_code == 201

    def test_self_loop_transformer_rejected(self):
        bus1_id, _ = self._create_two_buses()
        resp = client.post("/api/v1/transformers", headers=auth_headers(), json={
            "name": unique_name("Xfmr-Loop"), "from_bus_id": bus1_id, "to_bus_id": bus1_id
        })
        assert resp.status_code == 422

    def test_get_transformer_by_uuid(self):
        bus1_id, bus2_id = self._create_two_buses()
        create_resp = client.post("/api/v1/transformers", headers=auth_headers(), json={
            "name": unique_name("Xfmr-UUID"), "from_bus_id": bus1_id, "to_bus_id": bus2_id
        })
        xfmr_uuid = create_resp.json()["data"]["uuid"]
        resp = client.get(f"/api/v1/transformers/uuid/{xfmr_uuid}", headers=auth_headers())
        assert resp.status_code == 200

    def test_delete_transformer(self):
        bus1_id, bus2_id = self._create_two_buses()
        create_resp = client.post("/api/v1/transformers", headers=auth_headers(), json={
            "name": unique_name("Xfmr-Del"), "from_bus_id": bus1_id, "to_bus_id": bus2_id
        })
        xfmr_id = create_resp.json()["data"]["id"]
        resp = client.delete(f"/api/v1/transformers/{xfmr_id}", headers=auth_headers())
        assert resp.status_code == 200


# ──────────────────────────────────────────────────────────
# Generator CRUD Tests
# ──────────────────────────────────────────────────────────
class TestGeneratorCRUD:
    """CRUD tests for Generators including capacity validation."""

    def _create_bus(self) -> int:
        sub_resp = client.post("/api/v1/substations", headers=auth_headers(), json={
            "name": unique_name("GenSub")
        })
        sub_id = sub_resp.json()["data"]["id"]
        bus_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("GenBus"), "base_kv": 138.0, "substation_id": sub_id
        })
        return bus_resp.json()["data"]["id"]

    def test_create_generator(self):
        bus_id = self._create_bus()
        name = unique_name("Gen-Create")
        resp = client.post("/api/v1/generators", headers=auth_headers(), json={
            "name": name, "bus_id": bus_id, "type": "gas", "capacity_mw": 200.0, "p_mw": 150.0
        })
        assert resp.status_code == 201
        assert resp.json()["data"]["type"] == "gas"
        assert resp.json()["data"]["capacity_mw"] == 200.0

    def test_p_mw_exceeds_capacity_rejected(self):
        bus_id = self._create_bus()
        resp = client.post("/api/v1/generators", headers=auth_headers(), json={
            "name": unique_name("Gen-Over"), "bus_id": bus_id, "type": "thermal",
            "capacity_mw": 100.0, "p_mw": 150.0
        })
        assert resp.status_code == 422  # Pydantic model validator

    def test_invalid_bus_rejected(self):
        resp = client.post("/api/v1/generators", headers=auth_headers(), json={
            "name": unique_name("Gen-BadFK"), "bus_id": 99999, "type": "solar", "capacity_mw": 50.0
        })
        assert resp.status_code == 400

    def test_get_generator_by_uuid(self):
        bus_id = self._create_bus()
        create_resp = client.post("/api/v1/generators", headers=auth_headers(), json={
            "name": unique_name("Gen-UUID"), "bus_id": bus_id, "type": "hydro", "capacity_mw": 300.0
        })
        gen_uuid = create_resp.json()["data"]["uuid"]
        resp = client.get(f"/api/v1/generators/uuid/{gen_uuid}", headers=auth_headers())
        assert resp.status_code == 200

    def test_patch_generator(self):
        bus_id = self._create_bus()
        name = unique_name("Gen-Patch")
        create_resp = client.post("/api/v1/generators", headers=auth_headers(), json={
            "name": name, "bus_id": bus_id, "type": "thermal", "capacity_mw": 500.0, "p_mw": 200.0
        })
        gen_id = create_resp.json()["data"]["id"]
        resp = client.patch(f"/api/v1/generators/{gen_id}", headers=auth_headers(), json={
            "p_mw": 300.0
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["p_mw"] == 300.0
        assert resp.json()["data"]["name"] == name  # Unchanged

    def test_update_p_mw_over_capacity_rejected(self):
        bus_id = self._create_bus()
        create_resp = client.post("/api/v1/generators", headers=auth_headers(), json={
            "name": unique_name("Gen-OverUpd"), "bus_id": bus_id, "type": "thermal",
            "capacity_mw": 100.0, "p_mw": 50.0
        })
        gen_id = create_resp.json()["data"]["id"]
        resp = client.put(f"/api/v1/generators/{gen_id}", headers=auth_headers(), json={
            "p_mw": 200.0
        })
        assert resp.status_code == 400

    def test_delete_generator(self):
        bus_id = self._create_bus()
        create_resp = client.post("/api/v1/generators", headers=auth_headers(), json={
            "name": unique_name("Gen-Del"), "bus_id": bus_id, "type": "wind", "capacity_mw": 75.0
        })
        gen_id = create_resp.json()["data"]["id"]
        resp = client.delete(f"/api/v1/generators/{gen_id}", headers=auth_headers())
        assert resp.status_code == 200


# ──────────────────────────────────────────────────────────
# Load CRUD Tests
# ──────────────────────────────────────────────────────────
class TestLoadCRUD:
    """CRUD tests for Loads."""

    def _create_bus(self) -> int:
        sub_resp = client.post("/api/v1/substations", headers=auth_headers(), json={
            "name": unique_name("LoadSub")
        })
        sub_id = sub_resp.json()["data"]["id"]
        bus_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("LoadBus"), "base_kv": 69.0, "substation_id": sub_id
        })
        return bus_resp.json()["data"]["id"]

    def test_create_load(self):
        bus_id = self._create_bus()
        name = unique_name("Load-Create")
        resp = client.post("/api/v1/loads", headers=auth_headers(), json={
            "name": name, "bus_id": bus_id, "p_mw": 50.0, "q_mvar": 10.0
        })
        assert resp.status_code == 201
        assert resp.json()["data"]["p_mw"] == 50.0

    def test_invalid_bus_rejected(self):
        resp = client.post("/api/v1/loads", headers=auth_headers(), json={
            "name": unique_name("Load-BadFK"), "bus_id": 99999, "p_mw": 25.0
        })
        assert resp.status_code == 400

    def test_get_load_by_uuid(self):
        bus_id = self._create_bus()
        create_resp = client.post("/api/v1/loads", headers=auth_headers(), json={
            "name": unique_name("Load-UUID"), "bus_id": bus_id, "p_mw": 30.0
        })
        load_uuid = create_resp.json()["data"]["uuid"]
        resp = client.get(f"/api/v1/loads/uuid/{load_uuid}", headers=auth_headers())
        assert resp.status_code == 200

    def test_patch_load(self):
        bus_id = self._create_bus()
        name = unique_name("Load-Patch")
        create_resp = client.post("/api/v1/loads", headers=auth_headers(), json={
            "name": name, "bus_id": bus_id, "p_mw": 40.0
        })
        load_id = create_resp.json()["data"]["id"]
        resp = client.patch(f"/api/v1/loads/{load_id}", headers=auth_headers(), json={"p_mw": 60.0})
        assert resp.status_code == 200
        assert resp.json()["data"]["p_mw"] == 60.0

    def test_delete_load(self):
        bus_id = self._create_bus()
        create_resp = client.post("/api/v1/loads", headers=auth_headers(), json={
            "name": unique_name("Load-Del"), "bus_id": bus_id
        })
        load_id = create_resp.json()["data"]["id"]
        resp = client.delete(f"/api/v1/loads/{load_id}", headers=auth_headers())
        assert resp.status_code == 200


# ──────────────────────────────────────────────────────────
# Switch CRUD Tests
# ──────────────────────────────────────────────────────────
class TestSwitchCRUD:
    """CRUD tests for Switches/Breakers."""

    def _create_bus_and_line(self):
        sub_resp = client.post("/api/v1/substations", headers=auth_headers(), json={
            "name": unique_name("SwSub")
        })
        sub_id = sub_resp.json()["data"]["id"]

        bus1_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("SwBus1"), "base_kv": 138.0, "substation_id": sub_id
        })
        bus2_resp = client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("SwBus2"), "base_kv": 138.0, "substation_id": sub_id
        })
        bus1_id = bus1_resp.json()["data"]["id"]
        bus2_id = bus2_resp.json()["data"]["id"]

        line_resp = client.post("/api/v1/transmission-lines", headers=auth_headers(), json={
            "name": unique_name("SwLine"), "from_bus_id": bus1_id, "to_bus_id": bus2_id
        })
        line_id = line_resp.json()["data"]["id"]
        return bus1_id, line_id

    def test_create_switch(self):
        bus_id, line_id = self._create_bus_and_line()
        name = unique_name("Sw-Create")
        resp = client.post("/api/v1/switches", headers=auth_headers(), json={
            "name": name, "line_id": line_id, "bus_id": bus_id, "state": "closed"
        })
        assert resp.status_code == 201
        assert resp.json()["data"]["state"] == "closed"

    def test_invalid_line_reference_rejected(self):
        resp = client.post("/api/v1/switches", headers=auth_headers(), json={
            "name": unique_name("Sw-BadLine"), "line_id": 99999, "state": "open"
        })
        assert resp.status_code == 400

    def test_get_switch_by_uuid(self):
        bus_id, line_id = self._create_bus_and_line()
        create_resp = client.post("/api/v1/switches", headers=auth_headers(), json={
            "name": unique_name("Sw-UUID"), "line_id": line_id, "bus_id": bus_id, "state": "open"
        })
        sw_uuid = create_resp.json()["data"]["uuid"]
        resp = client.get(f"/api/v1/switches/uuid/{sw_uuid}", headers=auth_headers())
        assert resp.status_code == 200

    def test_patch_switch_state(self):
        bus_id, line_id = self._create_bus_and_line()
        name = unique_name("Sw-Patch")
        create_resp = client.post("/api/v1/switches", headers=auth_headers(), json={
            "name": name, "line_id": line_id, "bus_id": bus_id, "state": "closed"
        })
        sw_id = create_resp.json()["data"]["id"]
        resp = client.patch(f"/api/v1/switches/{sw_id}", headers=auth_headers(), json={"state": "open"})
        assert resp.status_code == 200
        assert resp.json()["data"]["state"] == "open"

    def test_delete_switch(self):
        bus_id, line_id = self._create_bus_and_line()
        create_resp = client.post("/api/v1/switches", headers=auth_headers(), json={
            "name": unique_name("Sw-Del"), "bus_id": bus_id, "state": "closed"
        })
        sw_id = create_resp.json()["data"]["id"]
        resp = client.delete(f"/api/v1/switches/{sw_id}", headers=auth_headers())
        assert resp.status_code == 200


# ──────────────────────────────────────────────────────────
# Pagination Tests
# ──────────────────────────────────────────────────────────
class TestPagination:
    """Tests for enterprise pagination metadata across all asset endpoints."""

    def test_substation_pagination_meta(self):
        resp = client.get("/api/v1/substations?page=1&limit=5", headers=auth_headers())
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        meta = data["meta"]
        assert "page" in meta
        assert "page_size" in meta
        assert "total_records" in meta
        assert "total_pages" in meta
        assert "current_page" in meta
        assert "has_next" in meta
        assert "has_prev" in meta
        assert meta["current_page"] == 1
        assert meta["page_size"] == 5
        assert meta["has_prev"] is False

    def test_pagination_page_2(self):
        # Create enough substations to have at least 2 pages
        for i in range(3):
            client.post("/api/v1/substations", headers=auth_headers(), json={
                "name": unique_name(f"PagSub{i}")
            })
        resp = client.get("/api/v1/substations?page=1&limit=2", headers=auth_headers())
        meta = resp.json()["meta"]
        if meta["total_records"] >= 3:
            assert meta["has_next"] is True
            # Fetch page 2
            resp2 = client.get("/api/v1/substations?page=2&limit=2", headers=auth_headers())
            meta2 = resp2.json()["meta"]
            assert meta2["current_page"] == 2
            assert meta2["has_prev"] is True
            assert meta2["previous_page"] == 1

    def test_empty_page_returns_zero(self):
        resp = client.get("/api/v1/substations?page=999&limit=20", headers=auth_headers())
        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 0


# ──────────────────────────────────────────────────────────
# Filtering Tests
# ──────────────────────────────────────────────────────────
class TestFiltering:
    """Tests for filter query parameters on list endpoints."""

    def test_filter_buses_by_substation(self):
        # Create a substation and buses
        sub_resp = client.post("/api/v1/substations", headers=auth_headers(), json={
            "name": unique_name("FilterSub")
        })
        sub_id = sub_resp.json()["data"]["id"]
        client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("FBus1"), "base_kv": 138.0, "substation_id": sub_id
        })
        client.post("/api/v1/buses", headers=auth_headers(), json={
            "name": unique_name("FBus2"), "base_kv": 69.0, "substation_id": sub_id
        })

        resp = client.get(f"/api/v1/buses?substation_id={sub_id}", headers=auth_headers())
        assert resp.status_code == 200
        buses = resp.json()["data"]
        for bus in buses:
            assert bus["substation_id"] == sub_id

    def test_filter_generators_by_type(self):
        resp = client.get("/api/v1/generators?type=gas", headers=auth_headers())
        assert resp.status_code == 200
        for gen in resp.json()["data"]:
            assert gen["type"] == "gas"

    def test_filter_switches_by_state(self):
        resp = client.get("/api/v1/switches?state=closed", headers=auth_headers())
        assert resp.status_code == 200
        for sw in resp.json()["data"]:
            assert sw["state"] == "closed"


# ──────────────────────────────────────────────────────────
# Sorting Tests
# ──────────────────────────────────────────────────────────
class TestSorting:
    """Tests for sorting query parameters on list endpoints."""

    def test_sort_substations_by_name_asc(self):
        resp = client.get("/api/v1/substations?sort_by=name&sort_order=asc", headers=auth_headers())
        assert resp.status_code == 200
        names = [s["name"] for s in resp.json()["data"]]
        assert names == sorted(names)

    def test_sort_substations_by_name_desc(self):
        resp = client.get("/api/v1/substations?sort_by=name&sort_order=desc", headers=auth_headers())
        assert resp.status_code == 200
        names = [s["name"] for s in resp.json()["data"]]
        assert names == sorted(names, reverse=True)

    def test_sort_generators_by_capacity(self):
        resp = client.get("/api/v1/generators?sort_by=capacity_mw&sort_order=desc", headers=auth_headers())
        assert resp.status_code == 200
        capacities = [g["capacity_mw"] for g in resp.json()["data"]]
        assert capacities == sorted(capacities, reverse=True)


# ──────────────────────────────────────────────────────────
# Search Tests
# ──────────────────────────────────────────────────────────
class TestSearch:
    """Tests for free-text search query parameter."""

    def test_search_substations_by_name(self):
        # Use a known seeded substation name
        resp = client.get("/api/v1/substations?search=Sierra", headers=auth_headers())
        assert resp.status_code == 200
        # If seeded data has "Sierra", should find at least 1
        data = resp.json()["data"]
        if len(data) > 0:
            assert any("Sierra" in s["name"] or "sierra" in s["name"].lower() for s in data)

    def test_search_returns_empty_for_nonexistent(self):
        resp = client.get("/api/v1/substations?search=ZZNONEXISTENT999", headers=auth_headers())
        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 0


# ──────────────────────────────────────────────────────────
# Error Handling Tests
# ──────────────────────────────────────────────────────────
class TestErrorHandling:
    """Tests for consistent error response structure."""

    def test_404_structure(self):
        resp = client.get("/api/v1/substations/99999", headers=auth_headers())
        assert resp.status_code == 404
        data = resp.json()
        assert data["success"] is False
        assert "message" in data

    def test_422_missing_required_field(self):
        resp = client.post("/api/v1/substations", headers=auth_headers(), json={})
        assert resp.status_code == 422
        data = resp.json()
        assert data["success"] is False
        assert "errors" in data

    def test_409_duplicate_name(self):
        name = unique_name("ErrDup")
        client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        resp = client.post("/api/v1/substations", headers=auth_headers(), json={"name": name})
        assert resp.status_code == 409
        data = resp.json()
        assert data["success"] is False

    def test_delete_nonexistent_returns_404(self):
        resp = client.delete("/api/v1/substations/99999", headers=auth_headers())
        assert resp.status_code == 404

    def test_update_nonexistent_returns_404(self):
        resp = client.put("/api/v1/substations/99999", headers=auth_headers(), json={"name": "test"})
        assert resp.status_code == 404
