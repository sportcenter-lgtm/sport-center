import json
import os
from datetime import datetime
from typing import List, Dict

class HistoryManager:
    def __init__(self, storage_file="history.json"):
        self.storage_file = storage_file
        self.history = self._load_history()

    def _load_history(self) -> Dict[str, List[Dict]]:
        if not os.path.exists(self.storage_file):
            return {}
        try:
            with open(self.storage_file, "r") as f:
                return json.load(f)
        except:
            return {}

    def _save_history(self):
        temp_file = f"{self.storage_file}.tmp"
        try:
            with open(temp_file, "w") as f:
                json.dump(self.history, f, indent=4)
                f.flush()
                os.fsync(f.fileno())
            os.replace(temp_file, self.storage_file)
        except Exception as e:
            print(f"Error saving {self.storage_file}: {e}")
            if os.path.exists(temp_file):
                os.remove(temp_file)

    def add_record(self, username: str, shot_type: str, score: float, feedback: List[str]):
        if username not in self.history:
            self.history[username] = []
        
        record = {
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "shot_type": shot_type,
            "score": score,
            "feedback": feedback
        }
        self.history[username].append(record)
        self._save_history()

    def get_user_history(self, username: str) -> List[Dict]:
        return self.history.get(username, [])
