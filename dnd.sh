#!/bin/bash

# Path to the file you want to drag and drop
FILE_PATH="/home/anandan/Desktop/1.jpeg"

# Coordinates of the file on your desktop (starting position for the drag)
START_X=60
START_Y=35

# Coordinates of the drop zone in the browser window
DROP_X=535
DROP_Y=385

# Find the Chrome browser window (assuming only one Chrome window is open)
WINDOW_ID=$(xdotool search --onlyvisible --name "Chrome" | head -n 1)

# If no window found, exit the script
if [ -z "$WINDOW_ID" ]; then
  echo "Chrome browser window not found!"
  exit 1
fi

# Activate the browser window
xdotool windowactivate $WINDOW_ID

# Move the mouse to the starting point (the file on the desktop)
echo "Moving mouse to starting point: ($START_X, $START_Y)"
xdotool mousemove --sync $START_X $START_Y

# Press the mouse button to start the drag
echo "Pressing mouse button to start the drag"
xdotool mousedown 1

# Perform smooth animation for drag-and-drop
# Calculate the number of steps for smoother animation
STEPS=20
for (( i=1; i<=STEPS; i++ ))
do
  # Calculate intermediate position
  INTERMEDIATE_X=$(( START_X + (DROP_X - START_X) * i / STEPS ))
  INTERMEDIATE_Y=$(( START_Y + (DROP_Y - START_Y) * i / STEPS ))

  # Move the mouse to the intermediate position
  xdotool mousemove --sync $INTERMEDIATE_X $INTERMEDIATE_Y

  # Sleep for a short duration to create a smooth animation
  sleep 0.002
done

# Move the mouse to the drop zone in the browser
echo "Moving mouse to drop zone: ($DROP_X, $DROP_Y)"
xdotool mousemove --sync $DROP_X $DROP_Y

# Release the mouse button to drop
echo "Releasing mouse button to drop"
xdotool mouseup 1
xdotool mousedown 1
xdotool mouseup 1

# Perform smooth animation to move the mouse back to the starting point
for (( i=1; i<=STEPS; i++ ))
do
  # Calculate intermediate position (backwards)
  INTERMEDIATE_X=$(( DROP_X + (START_X - DROP_X) * i / STEPS ))
  INTERMEDIATE_Y=$(( DROP_Y + (START_Y - DROP_Y) * i / STEPS ))

  # Move the mouse to the intermediate position
  xdotool mousemove --sync $INTERMEDIATE_X $INTERMEDIATE_Y

  # Sleep for a short duration to create a smooth animation
  sleep 0.002
done

# Move the mouse back to the starting point
echo "Moving mouse back to starting point: ($START_X, $START_Y)"
xdotool mousemove --sync $START_X $START_Y

echo "File dragged, dropped, and mouse moved back successfully."
