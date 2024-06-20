import pyautogui
import time
import os

# Set the path to the folder containing the files
folder_path = '/home/anandan/Desktop/1989 communication letters-20240610T192521Z-001/1989 communication letters'

# Set the screen coordinates for the browser drop area
drop_x, drop_y = 1000, 500  # Replace with the actual coordinates

# Time interval between each drag-and-drop operation (in seconds)
time_interval = 2

# Get a list of all files in the folder
files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]

# Loop through each file and perform the drag-and-drop operation
for file in files:
    # Construct the full file path
    file_path = os.path.join(folder_path, file)

    # Get the current mouse position (assume this is where the file icons are located)
    file_x, file_y = pyautogui.position()

    # Move the mouse to the file icon
    pyautogui.moveTo(file_x, file_y, duration=1)

    # Drag the file
    pyautogui.dragTo(drop_x, drop_y, duration=2)

    # Wait for the specified time interval before the next operation
    time.sleep(time_interval)
