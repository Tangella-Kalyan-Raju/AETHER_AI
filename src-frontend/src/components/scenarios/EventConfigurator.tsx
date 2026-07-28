import React from "react";
import { Box, Typography, TextField, Select, MenuItem, Slider } from "@mui/material";

interface EventConfiguratorProps {
  event: any;
  onChange: (updatedEvent: any) => void;
}

const EventConfigurator: React.FC<EventConfiguratorProps> = ({ event, onChange }) => {
  const handleChange = (field: string, value: any) => {
    onChange({ ...event, [field]: value });
  };

  const handleParamChange = (key: string, value: any) => {
    onChange({
      ...event,
      parameters_json: { ...event.parameters_json, [key]: value },
    });
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="subtitle2" mb={1}>
          Event Type
        </Typography>
        <Select
          fullWidth
          size="small"
          value={event.event_type}
          onChange={(e) => handleChange("event_type", e.target.value)}
        >
          <MenuItem value="Weather">Weather</MenuItem>
          <MenuItem value="Demand">Demand</MenuItem>
          <MenuItem value="Battery">Battery</MenuItem>
          <MenuItem value="Failure">Grid Failure</MenuItem>
        </Select>
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Start Offset (mins)"
          type="number"
          size="small"
          value={event.start_offset_mins}
          onChange={(e) => handleChange("start_offset_mins", parseInt(e.target.value))}
        />
        <TextField
          label="Duration (mins)"
          type="number"
          size="small"
          value={event.duration_mins}
          onChange={(e) => handleChange("duration_mins", parseInt(e.target.value))}
        />
      </Box>

      <Typography variant="subtitle2" mb={2}>
        Parameters
      </Typography>

      {event.event_type === "Weather" && (
        <Box mb={2}>
          <Typography variant="caption">Cloud Cover %</Typography>
          <Slider
            value={event.parameters_json.cloud_cover || 0}
            onChange={(_, val) => handleParamChange("cloud_cover", val)}
            valueLabelDisplay="auto"
          />
        </Box>
      )}

      {event.event_type === "Demand" && (
        <Box mb={2}>
          <Typography variant="caption">Load Increase %</Typography>
          <Slider
            value={event.parameters_json.load_increase || 0}
            onChange={(_, val) => handleParamChange("load_increase", val)}
            valueLabelDisplay="auto"
          />
        </Box>
      )}

      {event.event_type === "Failure" && (
        <TextField
          label="Asset ID"
          size="small"
          fullWidth
          value={event.parameters_json.asset_id || ""}
          onChange={(e) => handleParamChange("asset_id", e.target.value)}
        />
      )}
    </Box>
  );
};

export default EventConfigurator;
