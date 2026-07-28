import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface EventTimelineProps {
  events: any[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ events, selectedIndex, onSelect }) => {
  if (events.length === 0) {
    return (
      <Typography color="textSecondary" align="center" mt={4}>
        No events added yet.
      </Typography>
    );
  }

  return (
    <Box position="relative">
      <Box
        position="absolute"
        left={15}
        top={0}
        bottom={0}
        width={2}
        bgcolor="rgba(255,255,255,0.2)"
        zIndex={0}
      />
      {events.map((evt, idx) => (
        <Box
          key={idx}
          display="flex"
          alignItems="center"
          mb={2}
          position="relative"
          zIndex={1}
          onClick={() => onSelect(idx)}
          sx={{ cursor: "pointer", opacity: selectedIndex === idx ? 1 : 0.7 }}
        >
          <Box
            width={32}
            height={32}
            borderRadius="50%"
            bgcolor={selectedIndex === idx ? "primary.main" : "rgba(255,255,255,0.1)"}
            display="flex"
            alignItems="center"
            justifyContent="center"
            mr={2}
          >
            <Typography variant="caption">{idx + 1}</Typography>
          </Box>
          <Paper
            sx={{
              p: 2,
              flexGrow: 1,
              backgroundColor:
                selectedIndex === idx ? "rgba(144, 202, 249, 0.1)" : "rgba(255,255,255,0.05)",
            }}
          >
            <Typography variant="subtitle2">{evt.event_type} Event</Typography>
            <Typography variant="caption" color="textSecondary">
              T+{evt.start_offset_mins} mins • Lasts {evt.duration_mins}m
            </Typography>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default EventTimeline;
