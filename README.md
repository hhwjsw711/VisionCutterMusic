# VisionCutter: AI-Powered Video Editor

VisionCutter is a Python script that uses the power of Google's Gemini AI and local machine learning to automatically edit a collection of video clips into a finished video. It analyzes your clips for content, color, and motion, then uses different creative "personalities" to generate unique video edits.

This tool is perfect for creating dynamic music videos, artistic montages, or just for discovering interesting narrative connections within your footage.

## Features

- **Hybrid Analysis**: Combines Google Gemini's visual description capabilities with local motion analysis (using OpenCV) for a deep understanding of each clip.
- **Creative Editing Styles**: Comes with 6 pre-configured AI editor personalities:
    - `PULSATING_ENERGY`: Creates a high-energy, rhythmic edit.
    - `CHROMATIC_DREAM`: Focuses on color and mood to create a dream-like flow.
    - `NARRATIVE_CHAOS`: Juxtaposes clips for a chaotic, surreal effect.
    - `STORYTELLER`: Aims to build a coherent narrative from the clips.
    - `ACTION_STORYTELLER`: Edits like a Hollywood action trailer.
    - `POETIC_STORYTELLER`: Creates a visual poem by connecting clips metaphorically.
- **Intelligent Caching**: Automatically caches video analysis (`.json`) and pre-processed video segments. Subsequent runs are significantly faster, saving time and API costs.
- **Configurable**: Easily configure clip duration, editing styles to generate, and processing modes at the top of the script.
- **Interactive**: Prompts the user for the desired length of each clip (in frames) at runtime.

## Requirements

- Python 3.9+
- [FFmpeg](https://ffmpeg.org/download.html): Must be installed on your system and accessible from your terminal's PATH.

## Installation & Setup

1.  **Clone the Repository** (or ensure you have all the project files).

2.  **Add Your Video Clips**:
    - Place all your source video files (e.g., `.mp4`, `.mov`) inside the `clips` folder.

3.  **Set Up Your API Key**:
    - Create a file named `.env` in the root directory of the project.
    - Inside the `.env` file, add your Google AI API Key like this:
      ```
      GOOGLE_API_KEY="AIzaSy..."
      ```

4.  **Install Dependencies**:
    - Open your terminal in the project directory and run:
      ```bash
      pip install -r requirements.txt
      ```

## How to Use

1.  **Run the Script**:
    - Execute the script from your terminal:
      ```bash
      python main.py
      ```

2.  **Enter Clip Duration**:
    - The script will prompt you to enter the desired duration for each cut in the final video. Enter a number of **frames** (e.g., `14`). The script will calculate the duration in seconds based on the `OUTPUT_FPS` setting.

3.  **Wait for the Magic**:
    - **First Run**: The script will take some time to analyze each video and create cached versions. You will see detailed analysis data printed in the terminal.
    - **Subsequent Runs**: If the cache already exists for your chosen frame duration, the script will skip the analysis and processing steps and move directly to the final video creation, which is much faster.

4.  **Find Your Videos**:
    - The final videos will be saved in the root directory, with names corresponding to their editing style and frame length (e.g., `final_cut_STORYTELLER_14frames.mp4`).

## Customization

You can easily customize the script's behavior by editing the parameters at the top of `main.py`:

- `CLIP_MODE`: Choose between `'speed_up'` (compresses the whole clip to the target duration) or `'trim'` (cuts a segment from the middle of the clip).
- `STYLES_TO_GENERATE`: A Python list of which AI personalities you want to use. You can remove styles you don't want or reorder them.
- `OUTPUT_FPS`: The frame rate of the output videos. Defaults to 30.

---
*This project was collaboratively developed with an AI assistant.* 