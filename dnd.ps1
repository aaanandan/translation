Add-Type @"
using System;
using System.Runtime.InteropServices;

public class User32 {
    [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);

    [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
    public static extern bool SetCursorPos(int X, int Y);

    public const int MOUSEEVENTF_MOVE = 0x0001;
    public const int MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const int MOUSEEVENTF_LEFTUP = 0x0004;
}
"@

# Function to perform mouse event
function Invoke-MouseEvent {
    param (
        [Parameter(Mandatory = $true)]
        [ValidateSet("Move", "LeftDown", "LeftUp", "LeftClick")]
        [string]$Event,
        
        [Parameter(Mandatory = $false)]
        [int]$X = 0,
        
        [Parameter(Mandatory = $false)]
        [int]$Y = 0
    )
    
    switch ($Event) {
        "Move" {
            [User32]::SetCursorPos($X, $Y) | Out-Null
        }
        "LeftDown" {
            [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        }
        "LeftUp" {
            [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        }
        "LeftClick" {
            [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
            [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        }
    }
}

# Function to log progress to a text file and console
function Log-Progress {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $true)]
        [string]$LogFilePath
    )
    
    $timestamp = [datetime]::Now.ToString('yyyy-MM-dd HH:mm:ss')
    $logEntry = "${timestamp}: ${Message}"
    
    Add-Content -Path $LogFilePath -Value $logEntry
    Write-Output $logEntry
}

# Function to perform drag and drop for a file with randomized sleep and coordinates
function Perform-DragAndDrop {
    param (
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        
        [Parameter(Mandatory = $true)]
        [string]$DesktopPath,
        
        [Parameter(Mandatory = $true)]
        [string]$LogFilePath,
        
        [Parameter(Mandatory = $true)]
        [int]$FileX,
        
        [Parameter(Mandatory = $true)]
        [int]$FileY,
        
        [Parameter(Mandatory = $true)]
        [int]$BrowserX,
        
        [Parameter(Mandatory = $true)]
        [int]$BrowserY,

        [Parameter(Mandatory = $true)]
        [int]$ClearX,

        [Parameter(Mandatory = $true)]
        [int]$ClearY,

        [Parameter(Mandatory = $true)]
        [int]$MoveFileX,

        [Parameter(Mandatory = $true)]
        [int]$MoveFileY,

        [Parameter(Mandatory = $true)]
        [int]$CurrentFileCount,

        [Parameter(Mandatory = $true)]
        [int]$TotalFileCount
    )
    
    $FileName = [System.IO.Path]::GetFileName($FilePath)
    $DesktopFile = [System.IO.Path]::Combine($DesktopPath, $FileName)
    
    try {
        # Copy the file to the desktop
        Copy-Item -Path $FilePath -Destination $DesktopFile
        Log-Progress -Message "($CurrentFileCount/$TotalFileCount) Copied $FileName to desktop." -LogFilePath $LogFilePath

        # Perform the drag and drop operation with randomized sleep and coordinates
        Start-Sleep -Milliseconds (3000 + (Get-Random -Minimum 0 -Maximum 1000))
        Invoke-MouseEvent -Event Move -X $FileX -Y $FileY
        Start-Sleep -Milliseconds (500 + (Get-Random -Minimum 0 -Maximum 500))
        Invoke-MouseEvent -Event LeftDown
        Start-Sleep -Milliseconds (500 + (Get-Random -Minimum 0 -Maximum 500))

        # Generate random offsets for browser coordinates
        $NewBrowserX = $BrowserX + (Get-Random -Minimum 0 -Maximum 101)
        $NewBrowserY = $BrowserY + (Get-Random -Minimum 0 -Maximum 101)
        Invoke-MouseEvent -Event Move -X $NewBrowserX -Y $NewBrowserY
        Start-Sleep -Milliseconds (500 + (Get-Random -Minimum 0 -Maximum 1001))
        Invoke-MouseEvent -Event LeftUp
        Start-Sleep -Milliseconds (12000 + (Get-Random -Minimum 0 -Maximum 2001))
        Log-Progress -Message "($CurrentFileCount/$TotalFileCount) Dragged and dropped $FileName and waited 10 sec." -LogFilePath $LogFilePath

        # Generate random offsets for clear coordinates
        $NewClearX = $ClearX + (Get-Random -Minimum 0 -Maximum 10)
        $NewClearY = $ClearY + (Get-Random -Minimum 0 -Maximum 10)
        Invoke-MouseEvent -Event Move -X $NewClearX -Y $NewClearY
        Start-Sleep -Milliseconds (500 + (Get-Random -Minimum 0 -Maximum 1001))
        Invoke-MouseEvent -Event LeftClick

         # move the File in screen
        Invoke-MouseEvent -Event Move -X $FileX -Y $FileY
        Start-Sleep -Milliseconds 1000
        Invoke-MouseEvent -Event LeftDown
        Start-Sleep -Milliseconds 100
        Invoke-MouseEvent -Event Move -X $MoveFileX -Y $MoveFileY
        Start-Sleep -Milliseconds 1000
        Invoke-MouseEvent -Event LeftUp

        # Clean up the desktop
        # Remove-Item -Path $DesktopFile
        Log-Progress -Message "($CurrentFileCount/$TotalFileCount) Moved $FileName from desktop." -LogFilePath $LogFilePath
    }
    catch {
        Log-Progress -Message "($CurrentFileCount/$TotalFileCount) Error occurred: $_" -LogFilePath $LogFilePath
    }
}

# Main script

$FolderPath = "C:\Users\anand\Downloads\Accounts-20240619T124439Z-001\Accounts"
$LogPath = "C:\Apps\tl\translation"
$LogFilePath = [System.IO.Path]::Combine($LogPath, "DragAndDropLog.txt")
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$ResumeIndexFilePath = [System.IO.Path]::Combine($LogPath, "ResumeIndex.txt")

# Coordinates for the file on the desktop and the target in the browser
$FileX = 50  # Adjusted X coordinate of the file on the desktop
$FileY = 50  # Adjusted Y coordinate of the file on the desktop
$BrowserX = 200  # Adjusted X coordinate of the target in the browser
$BrowserY = 700  # Adjusted Y coordinate of the target in the browser
$ClearX = 520  # X coordinate for the clear position
$ClearY = 490  # Y coordinate for the clear position
$MoveFileX = 20  # X coordinate to move the file to after drag and drop
$MoveFileY = 200  # Y coordinate to move the file to after drag and drop

# Get the list of image files from the specified folder recursively
$imageExtensions = @("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.gif", "*.tiff")
$Files = Get-ChildItem -Path $FolderPath -Recurse -Include $imageExtensions

$TotalFileCount = $Files.Count
$CurrentFileCount = 0

# Read the resume index if it exists
if (Test-Path $ResumeIndexFilePath) {
    $ResumeIndex = [int](Get-Content -Path $ResumeIndexFilePath)
    Log-Progress -Message "Resuming from index $ResumeIndex." -LogFilePath $LogFilePath
} else {
    $ResumeIndex = 0
}

$CurrentFileCount=$ResumeIndex
# Process each file starting from the resume index
foreach ($File in $Files[$ResumeIndex..($TotalFileCount - 1)]) {
    $CurrentFileCount++
    Perform-DragAndDrop -FilePath $File.FullName -DesktopPath $DesktopPath -LogFilePath $LogFilePath -FileX $FileX -FileY $FileY -BrowserX $BrowserX -BrowserY $BrowserY -ClearX $ClearX -ClearY $ClearY -MoveFileX $MoveFileX -MoveFileY $MoveFileY -CurrentFileCount $CurrentFileCount -TotalFileCount $TotalFileCount
    
    # Update the resume index
    $ResumeIndex++
    Set-Content -Path $ResumeIndexFilePath -Value $ResumeIndex
}
