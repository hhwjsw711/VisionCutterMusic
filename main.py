import os
import subprocess
import time
import json
from dotenv import load_dotenv
import google.generativeai as genai
import cv2
import numpy as np
import shutil

# --- 1. EDITING PARAMETERS (Tweak these!) ---
CLIP_MODE = 'speed_up'        # 'speed_up' to fit the whole clip, or 'trim' to cut a segment
STYLES_TO_GENERATE = [
    'PULSATING_ENERGY', 'CHROMATIC_DREAM', 'NARRATIVE_CHAOS', 'STORYTELLER',
    'ACTION_STORYTELLER', 'POETIC_STORYTELLER'
] # A list of styles to generate
OUTPUT_FPS = 30               # The frame rate of the final output video

# --- 2. ADVANCED CONFIGURATION ---
CLIPS_DIR = "clips"
WORKSPACE_DIR = "workspace"
CACHE_DIR = "cache" # Directory to store analysis results
VISION_MODEL = "gemini-1.5-flash"
CREATIVE_MODEL = "gemini-1.5-pro"

# --- 3. SCRIPT LOGIC (No need to edit below) ---
def setup_environment():
    """Loads environment variables and configures the AI client."""
    print("1. Initializing environment...")
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: 'GOOGLE_API_KEY' not found in .env file.")
        exit()
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        print(f"ERROR: Could not configure Gemini client: {e}")
        exit()

def get_video_duration(video_path):
    """Gets the duration of a video file using ffprobe."""
    command = [
        'ffprobe',
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        video_path
    ]
    try:
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, text=True)
        return float(result.stdout)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"  WARNING: ffprobe failed for {video_path}. Could not get duration.")
        return None

def calculate_motion_score(video_path):
    """Calculates a motion score for a video using optical flow."""
    try:
        cap = cv2.VideoCapture(video_path)
        ret, prev_frame = cap.read()
        if not ret:
            cap.release()
            return 0.0

        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        total_magnitude = 0
        frame_count = 0

        # Analyze a few frames to get an average
        for _ in range(5):
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            magnitude, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            total_magnitude += np.mean(magnitude)
            prev_gray = gray
            frame_count += 1

        cap.release()
        if frame_count == 0:
            return 0.0
        
        # Normalize the score to a more intuitive range
        motion_score = (total_magnitude / frame_count) * 10
        return float(round(motion_score, 2))

    except Exception as e:
        print(f"  WARNING: Could not calculate motion score for {video_path}. Error: {e}")
        return 0.0

def upload_video_to_gemini(video_path):
    """Uploads a video file to the Gemini API and waits for it to be ready."""
    print(f"    - Uploading '{os.path.basename(video_path)}' to Gemini...")
    video_file = genai.upload_file(path=video_path, display_name=os.path.basename(video_path))
    print(f"    - Gemini processing video... (ID: {video_file.name})")
    while video_file.state.name == "PROCESSING":
        time.sleep(5)
        video_file = genai.get_file(video_file.name)
    if video_file.state.name == "FAILED":
        raise ValueError(f"Video processing failed: {video_file.name}")
    print(f"    - Gemini analysis ready.")
    return video_file

def analyze_video_with_ai(video_path):
    """Sends a video to Gemini for detailed visual analysis."""
    try:
        video_file = upload_video_to_gemini(video_path)
        model = genai.GenerativeModel(VISION_MODEL)
        prompt = """
You are a master film analyst. Your task is to analyze the provided video clip and return a structured JSON object.

INSTRUCTIONS:
1.  **Analyze**: Carefully observe the clip's content, colors, and mood.
2.  **Language**: All text values in the JSON must be in English.
3.  **Format**: Respond ONLY with a valid JSON object. Do NOT include markdown fences (```json), conversational text, or any other characters outside the JSON structure.

JSON STRUCTURE:
{
  "action_description": "A concise, evocative description of the main action or subject.",
  "dominant_colors": ["A list of 3-5 dominant or symbolic colors as english words (e.g., 'deep purple', 'neon pink', 'golden yellow')."],
  "camera_movement": "Describe the camera work (e.g., 'static shot', 'slow pan right', 'fast zoom in', 'handheld shaky cam', 'smooth tracking shot').",
  "overall_mood": "A few words describing the atmosphere or feeling (e.g., 'serene and peaceful', 'energetic and chaotic', 'mysterious and futuristic')."
}
"""
        response = model.generate_content([prompt, video_file])
        genai.delete_file(video_file.name)
        
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)
        
    except Exception as e:
        print(f"  ERROR during video analysis for {video_path}: {e}")
        if 'video_file' in locals() and video_file:
            genai.delete_file(video_file.name)
        return None

def get_creative_editing_styles():
    """Returns a dictionary of different creative editing prompts."""
    return {
        'PULSATING_ENERGY': """
You are an editor for high-energy music videos. Your mission is to CREATE energy through editing.
- Your primary tool is the cut. Create a fast-paced, almost jarring rhythm.
- **Heavily prioritize clips with a high `motion_score` (e.g., > 1.0).** Also, use clips with 'fast' or 'shaky' `camera_movement`.
- Use frequent, hypnotic repetitions of the most striking visuals, especially those with high motion.
- Juxtapose different clips aggressively to build intensity. The sequence must feel like a visual drum machine.
""",
        'CHROMATIC_DREAM': """
You are an editor for an art-house film. Your style is painterly and deliberate.
You build visual narratives through color and mood.
- Create "chapters" of clips that share a similar `dominant_colors` palette.
- Transition smoothly between color palettes.
- You can create powerful moments by contrasting a sequence of low `motion_score` clips (like 'static shots') with a sudden high `motion_score` clip.
- Repetition should be used sparingly, to emphasize a key mood.
""",
        'NARRATIVE_CHAOS': """
You are an avant-garde editor inspired by surrealism. You find meaning in chaos.
Your goal is to create a visually jarring and thought-provoking sequence.
- **Create chaos by aggressively mismatching `motion_score`**. Follow a static clip (score < 0.1) with a highly dynamic one (score > 1.5).
- Use the `camera_movement` description to create further contrast, e.g., a 'slow pan' followed by a 'whip pan'.
- Deliberately mismatch moods and colors for maximum contrast.
- Tell a broken, abstract story. Let the viewer find their own meaning.
""",
        'STORYTELLER': """
You are a narrative film editor. Your goal is to tell a coherent and compelling story using the available clips.
- **Your primary focus is the `action_description`.** Find logical or poetic connections between the descriptions to create a narrative flow.
- **Build a simple story arc**: Try to establish a scene (beginning), develop an idea or action (middle), and provide a resolution or final image (end).
- **Use `camera_movement` to guide the viewer's eye**: A 'pan right' can lead into another clip, creating a sense of continuous space. A 'zoom in' can create focus.
- **Consider the `overall_mood`**: Build an emotional journey. Start calm, build to a climax, and end on a thoughtful note.
- **Repetition is for narrative effect**: Only repeat a clip if it serves as a memory, a flashback, or a recurring motif that enhances the story. Avoid random repetition.
""",
        'ACTION_STORYTELLER': """
You are a Hollywood action movie trailer editor. Your job is to create a high-impact, thrilling narrative sequence.
- **Find your "money shots"**: Identify clips with the highest `motion_score` and dramatic `action_description` (e.g., explosions, fast movement, dramatic reveals). These are your climax.
- **Build the structure**: Start with establishing shots (low motion, wide views), build suspense with clips of rising action, hit the climax with your best shots, and conclude with a final, impactful image.
- **Pacing is key**: Use a few quick cuts together to build excitement. Let a dramatic shot breathe for a moment.
- **The story should be simple and powerful**: Good guy, bad guy, big explosion. Find that story in the clips.
""",
        'POETIC_STORYTELLER': """
You are a visual poet. You create meaning not from literal events, but from the juxtaposition of images, colors, and moods.
- **Focus on `overall_mood` and `dominant_colors`**: Create an emotional journey. For example, transition from a "serene" blue sequence to a "chaotic" red one.
- **Find metaphors**: Connect clips by theme. A clip of a flower opening could be followed by a sunrise. A clip of a falling object could be followed by a sad face.
- **The `action_description` is a line in your poem**: Read all the descriptions and arrange them to create a verse.
- **Rhythm is emotional**: Use `motion_score` to control the emotional pacing. A series of static shots can create contemplation before a high-motion shot provides an emotional release.
"""
    }

def get_artistic_sequence_from_ai(clips_data, style):
    """Sends clip analysis data to the creative AI to get the final editing sequence."""
    print(f"\n4. Requesting artistic sequence from AI (Style: {style})...")
    
    styles = get_creative_editing_styles()
    if style not in styles:
        print(f"  ERROR: Editing style '{style}' not found. Defaulting to 'PULSATING_ENERGY'.")
        style = 'PULSATING_ENERGY'
        
    model = genai.GenerativeModel(CREATIVE_MODEL)
    system_prompt = styles[style]

    # Make sequence length dynamic to ensure all clips can be included
    num_clips = len(clips_data)
    min_len = num_clips
    max_len = num_clips + 10 # Allow for some creative repetition
    
    user_prompt = f"""
{system_prompt}
Your task is to create a compelling video sequence by ordering the clips provided below.

RULES:
1.  **Mandatory Inclusion**: You MUST use every single clip from 'AVAILABLE CLIPS DATA' at least once in your final sequence.
2.  **Output Format**: Your response must be ONLY a Python list of filenames. Do not add any other text.
3.  **Repetition**: After including every clip once, you are encouraged to repeat clips to create rhythm, as per your style.
4.  **Sequence Length**: The final list must contain between {min_len} and {max_len} clip filenames.
5.  **Analyze the Data**: Use the detailed JSON data for each clip, especially the `motion_score`, to inform your creative choices.

AVAILABLE CLIPS DATA:
```json
{json.dumps(clips_data, indent=2)}
```

Return only the Python list of filenames. Example: ['clip01.mp4', 'clip02.mp4', 'clip03.mp4', 'clip01.mp4']
"""
    try:
        response = model.generate_content(user_prompt, generation_config={"temperature": 0.9})
        raw_response = response.text.strip()
        if "```" in raw_response:
             raw_response = raw_response.split("```")[1].replace("python", "").strip()
        
        print(f"  - AI Raw Response (cleaned): {raw_response}")
        import ast
        ordered_list = ast.literal_eval(raw_response)
        if isinstance(ordered_list, list):
            return ordered_list
        return []
    except Exception as e:
        print(f"  ERROR during creative sequencing: {e}")
        return []

def generate_final_video(ordered_sequence, target_frames, output_filename):
    """Generates the final video by concatenating pre-cached segments."""
    print(f"\n5. Generating final video for '{output_filename}'...")
    if not ordered_sequence:
        print("  - ERROR: The editing sequence is empty. Aborting video generation.")
        return

    # Create the concat list pointing to the cached, pre-processed segments
    concat_list_path = os.path.join(WORKSPACE_DIR, "concat_list.txt")
    with open(concat_list_path, 'w') as f:
        for clip_filename in ordered_sequence:
            # IMPORTANT: All segments are now expected to be in the cache
            cached_segment_path = os.path.join(CACHE_DIR, f"{clip_filename}_{target_frames}frames.mp4")
            if os.path.exists(cached_segment_path):
                 f.write(f"file '{os.path.abspath(cached_segment_path)}'\n")
            else:
                print(f"  - WARNING: Cached segment for {clip_filename} not found! Skipping.")

    command = [
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
        '-i', concat_list_path,
        '-c', 'copy', # Fast copy, no re-encoding needed
        '-r', str(OUTPUT_FPS),
        output_filename
    ]

    try:
        print(f"  - Concatenating {len(ordered_sequence)} cached segments...")
        subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"\n✨ SUCCESS! Final video generated: {output_filename}")

    except subprocess.CalledProcessError as e:
        print(f"  - ERROR during FFmpeg processing.")
        print(f"  - Command: {' '.join(e.cmd)}")
        print(f"  - Stderr: {e.stderr}")
    except FileNotFoundError:
        print("  - ERROR: 'ffmpeg' or 'ffprobe' not found. Ensure they are installed and in your system's PATH.")
        exit()

def main():
    """Main function to orchestrate the video creation process."""
    setup_environment()

    # --- Interactive Input for Frame Duration ---
    while True:
        try:
            frames_str = input(f"Enter the target duration for each clip in FRAMES (output will be {OUTPUT_FPS}fps): ")
            target_clip_duration_frames = int(frames_str)
            if target_clip_duration_frames > 0:
                break
            else:
                print("  Please enter a positive number of frames.")
        except ValueError:
            print("  Invalid input. Please enter an integer.")

    target_clip_duration_s = target_clip_duration_frames / OUTPUT_FPS
    
    # --- Directory Setup ---
    for dir_path in [WORKSPACE_DIR, CACHE_DIR, CLIPS_DIR]:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

    try:
        all_video_files = [f for f in os.listdir(CLIPS_DIR) if f.lower().endswith(('.mp4', '.mov', '.avi'))]
        if not all_video_files:
            print(f"ERROR: No video files found in the '{CLIPS_DIR}' directory.")
            exit()
    except FileNotFoundError:
        print(f"ERROR: The '{CLIPS_DIR}' directory does not exist.")
        exit()

    # --- STAGE 1: Analysis and Pre-processing Cache ---
    print(f"\n2. Analyzing and Caching {len(all_video_files)} video clips...")
    clips_data = []
    for video_file in all_video_files:
        video_path = os.path.join(CLIPS_DIR, video_file)
        analysis_cache_path = os.path.join(CACHE_DIR, f"{video_file}.json")
        segment_cache_path = os.path.join(CACHE_DIR, f"{video_file}_{target_clip_duration_frames}frames.mp4")
        print(f"  - Checking '{video_file}'...")

        # Get analysis from cache or generate it
        if os.path.exists(analysis_cache_path):
            print(f"    - Analysis found in cache.")
            with open(analysis_cache_path, 'r') as f:
                analysis = json.load(f)
        else:
            print("    - No analysis cache found. Performing full analysis...")
            print("      - Calculating local motion score...")
            motion_score = calculate_motion_score(video_path)
            print(f"      - Motion Score: {motion_score}")
            analysis = analyze_video_with_ai(video_path)
            if analysis:
                analysis['motion_score'] = motion_score
                with open(analysis_cache_path, 'w') as f:
                    json.dump(analysis, f, indent=4)
                print(f"      - Analysis saved to cache.")
        
        if not analysis:
            print("    - ERROR: Could not analyze video. Skipping.")
            continue
        
        analysis['filename'] = video_file
        clips_data.append(analysis)

        # Create pre-processed segment if it doesn't exist in cache
        if not os.path.exists(segment_cache_path):
            print(f"    - Pre-processed segment not found. Creating '{os.path.basename(segment_cache_path)}'...")
            source_duration = get_video_duration(video_path)
            if source_duration:
                filter_chain = ""
                if CLIP_MODE == 'speed_up':
                    speed_factor = source_duration / target_clip_duration_s if target_clip_duration_s > 0 else 1
                    filter_chain = f"setpts=PTS/{speed_factor:.4f},scale=1920:1080:force_original_aspect_ratio=decrease,pad=w=1920:h=1080:x=-1:y=-1"
                else: # 'trim' mode
                    start_time = max(0, (source_duration / 2) - (target_clip_duration_s / 2))
                    filter_chain = f"trim=start={start_time:.4f}:duration={target_clip_duration_s:.4f},setpts=PTS-STARTPTS,scale=1920:1080:force_original_aspect_ratio=decrease,pad=w=1920:h=1080:x=-1:y=-1"
                
                command = [
                    'ffmpeg', '-y', '-i', video_path,
                    '-vf', filter_chain,
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
                    '-an',
                    segment_cache_path
                ]
                try:
                    subprocess.run(command, check=True, capture_output=True, text=True)
                    print(f"    - Segment cached successfully.")
                except subprocess.CalledProcessError as e:
                    print(f"      - ERROR caching segment: {e.stderr}")
        else:
            print(f"    - Pre-processed segment found in cache.")

    if not clips_data:
        print("\nERROR: No clips could be analyzed. Halting script.")
        exit()
        
    print("\n3. All clips are analyzed and cached.")

    # --- STAGE 2: Creative Editing ---
    for style in STYLES_TO_GENERATE:
        print("---------------------------------------------------------")
        ordered_sequence = get_artistic_sequence_from_ai(clips_data, style)
        
        if not ordered_sequence:
            print(f"\nWARNING: Could not generate sequence for style '{style}'. Skipping.")
            continue
            
        # --- VALIDATION STEP ---
        validated_sequence = [f for f in ordered_sequence if f in all_video_files]
        if len(validated_sequence) != len(ordered_sequence):
            print("  - WARNING: AI returned some non-existent filenames, which were removed.")

        if not validated_sequence:
            print(f"\nWARNING: No valid clips remained after validation for style '{style}'. Skipping.")
            continue
            
        print(f"\n  - Artistic sequence received and validated for style '{style}' ({len(validated_sequence)} cuts).")

        output_filename = f"final_cut_{style}_{target_clip_duration_frames}frames.mp4"
        generate_final_video(validated_sequence, target_clip_duration_frames, output_filename)

    print("---------------------------------------------------------")
    print("\n✅ All video generation tasks are complete.")

if __name__ == "__main__":
    main() 