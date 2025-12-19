import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional

class ScheduleManager:
    def __init__(self, players_file="players.json", classes_file="classes.json", targets_file="targets.json"):
        self.players_file = players_file
        self.classes_file = classes_file
        self.targets_file = targets_file
        self.players = self._load_json(self.players_file, list)
        self.classes = self._load_json(self.classes_file, list)
        self.monthly_targets = self._load_json(self.targets_file, dict)

    def _load_json(self, filepath: str, default_type=list) -> any:
        if not os.path.exists(filepath):
            return default_type()
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except:
            return default_type()

    def _save_json(self, data: any, filepath: str):
        with open(filepath, "w") as f:
            json.dump(data, f, indent=4)

    # --- Player Management ---
    def add_player(self, name: str, level: int, default_days: List[str] = []) -> Dict:
        player = {
            "id": str(uuid.uuid4()),
            "name": name,
            "level": level,
            "default_days": default_days,
            "makeup_credits": 0,
            "stats": {
                "classes_attended": 0,
                "makeups_used": 0
            }
        }
        self.players.append(player)
        self._save_json(self.players, self.players_file)
        return player

    def get_players(self) -> List[Dict]:
        return self.players

    def get_player(self, player_id: str) -> Optional[Dict]:
        for p in self.players:
            if p["id"] == player_id:
                return p
        return None

    def delete_player(self, player_id: str) -> bool:
        # Check if player exists
        player_exists = any(p["id"] == player_id for p in self.players)
        if not player_exists:
            return False
            
        # 1. Remove from players list
        self.players = [p for p in self.players if p["id"] != player_id]
        self._save_json(self.players, self.players_file)
        
        # 2. Remove from all class rosters and attendance
        modified_classes = False
        for c in self.classes:
            removed = False
            if player_id in c["student_ids"]:
                c["student_ids"].remove(player_id)
                removed = True
            
            if "attendance" in c and player_id in c["attendance"]:
                del c["attendance"][player_id]
                removed = True
                
            if removed:
                modified_classes = True
                
        if modified_classes:
            self._save_json(self.classes, self.classes_file)
            
        return True

    # --- Class Management ---
    def create_class(self, date_str: str, time_str: str, student_ids: List[str] = [], coach_name: str = None, max_students: int = 4) -> Dict:
        # date_str format: "YYYY-MM-DD"
        # time_str format: "HH:MM"
        new_class = {
            "id": str(uuid.uuid4()),
            "date": date_str,
            "time": time_str,
            "student_ids": [sid for sid in student_ids], # Copy list
            "max_students": max_students,
            "coach": coach_name
        }
        self.classes.append(new_class)
        self._save_json(self.classes, self.classes_file)
        return new_class

    def create_monthly_series(self, month_str: str, weekday: str, time_str: str, student_ids: List[str] = [], coach_name: str = None, max_students: int = 4) -> List[Dict]:
        """
        Creates a class for every occurrence of `weekday` in `month_str`.
        month_str: "2025-01"
        weekday: "Monday", "Tuesday", etc.
        """
        import calendar
        
        # Parse year, month
        year, month = map(int, month_str.split("-"))
        
        weekday_map = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, 
            "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        target_weekday = weekday_map.get(weekday)
        if target_weekday is None:
            return []

        cal = calendar.monthcalendar(year, month)
        created_classes = []
        
        for week in cal:
            day = week[target_weekday]
            if day != 0:
                date_str = f"{year}-{month:02d}-{day:02d}"
                # Create the class
                new_cls = self.create_class(date_str, time_str, student_ids, coach_name, max_students)
                created_classes.append(new_cls)
                
        return created_classes

    def update_class(self, class_id: str, date: str = None, time: str = None, coach: str = None, student_ids: List[str] = None, max_students: int = None) -> bool:
        for c in self.classes:
            if c["id"] == class_id:
                if date:
                    c["date"] = date
                if time:
                    c["time"] = time
                if coach is not None:
                    c["coach"] = coach
                if student_ids is not None:
                    c["student_ids"] = student_ids
                if max_students is not None:
                    c["max_students"] = max_students
                self._save_json(self.classes, self.classes_file)
                return True
        return False

    def batch_enroll(self, player_id: str, month: str, weekday: str, time: str, coach: str = None) -> int:
        """
        Enrolls a player into all classes matching the pattern in the given month.
        """
        import datetime
        count = 0
        for cls in self.classes:
            # Check Month
            if not cls["date"].startswith(month):
                continue
            
            # Check Time
            if cls["time"] != time:
                continue

            # Check Coach
            # If function arg is None, we act liberally? No, strict matching usually.
            # Interpreting "coach=None" as "Any" might be risky. Let's assume strict if provided.
            # Check Coach
            # Strict matching: if function arg 'coach' provided (even None), it must match cls['coach']
            # NOTE: We treat empty string as None for comparison safety if needed, 
            # but usually it's better to be exact.
            if coach != cls.get("coach"):
                continue

            # Check Weekday
            try:
                dt = datetime.datetime.strptime(cls["date"], "%Y-%m-%d")
                d_name = dt.strftime("%A")
                if d_name != weekday:
                    continue
            except:
                continue

            # Checks passed -> Enroll
            if "student_ids" not in cls:
                cls["student_ids"] = []

            if player_id not in cls["student_ids"]:
                if len(cls["student_ids"]) < cls["max_students"]:
                    cls["student_ids"].append(player_id)
                    count += 1
        
        if count > 0:
            self._save_json(self.classes, self.classes_file)
        return count

    def batch_unenroll(self, player_id: str, month: str, weekday: str, time: str, coach: str = None) -> int:
        """
        Removes a player from all classes matching the pattern in the given month.
        """
        import datetime
        count = 0
        for cls in self.classes:
            # Check Month
            if not cls["date"].startswith(month):
                continue
            
            # Check Time
            if cls["time"] != time:
                continue

            # Check Coach (Strict)
            if coach != cls.get("coach"):
                continue

            # Check Weekday
            try:
                dt = datetime.datetime.strptime(cls["date"], "%Y-%m-%d")
                d_name = dt.strftime("%A")
                if d_name != weekday:
                    continue
            except:
                continue

            # Checks passed -> Unenroll
            if "student_ids" in cls and player_id in cls["student_ids"]:
                cls["student_ids"].remove(player_id)
                
                # Cleanup attendance too
                if "attendance" in cls and player_id in cls["attendance"]:
                    del cls["attendance"][player_id]
                    
                count += 1
        
        if count > 0:
            self._save_json(self.classes, self.classes_file)
        return count

    def delete_class(self, class_id: str) -> bool:
        initial_len = len(self.classes)
        self.classes = [c for c in self.classes if c["id"] != class_id]
        if len(self.classes) < initial_len:
            self._save_json(self.classes, self.classes_file)
            return True
        return False

    def delete_classes(self, class_ids: List[str]) -> int:
        initial_len = len(self.classes)
        self.classes = [c for c in self.classes if c["id"] not in class_ids]
        deleted_count = initial_len - len(self.classes)
        if deleted_count > 0:
            self._save_json(self.classes, self.classes_file)
        return deleted_count

    def propagate_class_properties(self, source_class_id: str, match_time: str = None) -> int:
        """
        Copies time, coach, and max_students from the source class to all other classes
        that share the same weekday and month.
        If match_time is provided, it targets classes with that time.
        Otherwise, it defaults to the source class's CURRENT time.
        """
        import datetime
        
        source = next((c for c in self.classes if c["id"] == source_class_id), None)
        if not source:
            return 0
            
        # Parse source info
        try:
            s_date = datetime.datetime.strptime(source["date"], "%Y-%m-%d")
            s_month = source["date"][:7] # YYYY-MM
            s_weekday = s_date.strftime("%A")
        except:
            return 0
            
        # Determine the time to look for
        target_time = match_time if match_time else source["time"]

        count = 0
        for c in self.classes:
            if c["id"] == source_class_id:
                continue
                
            # Check match
            if not c["date"].startswith(s_month):
                continue
                
            # Match against the target_time (which might be the OLD time)
            if c["time"] != target_time:
                continue

            try:
                c_date = datetime.datetime.strptime(c["date"], "%Y-%m-%d")
                if c_date.strftime("%A") != s_weekday:
                    continue
            except:
                continue
                
            # Update properties
            c["time"] = source["time"]
            c["coach"] = source["coach"]
            c["max_students"] = source.get("max_students", 4)
            count += 1
            
        if count > 0:
            self._save_json(self.classes, self.classes_file)
            
        return count

    def get_classes(self, month: Optional[str] = None) -> List[Dict]:
        # Simple filter by YYYY-MM if provided
        if not month:
            # Sort by date and time
            self.classes.sort(key=lambda x: (x["date"], x["time"]))
            return self.classes
        
        filtered = [c for c in self.classes if c["date"].startswith(month)]
        filtered.sort(key=lambda x: (x["date"], x["time"]))
        return filtered

    def copy_month_schedule(self, target_month_str: str) -> (bool, str):
        """
        Copies the schedule structure (Weekday, Time, Coach) from the previous month 
        to the target_month. Does NOT copy students.
        target_month_str: "YYYY-MM"
        """
        try:
            # 1. Calculate previous month
            t_year, t_month = map(int, target_month_str.split("-"))
            if t_month == 1:
                p_year = t_year - 1
                p_month = 12
            else:
                p_year = t_year
                p_month = t_month - 1
            
            source_month_str = f"{p_year}-{p_month:02d}"
            
            # --- NEW: Copy Monthly Target ---
            prev_target = self.get_target(source_month_str)
            self.set_target(target_month_str, prev_target)
            
            # 2. Get source classes
            source_classes = self.get_classes(source_month_str)
            if not source_classes:
                return False, f"No classes found in previous month ({source_month_str})"

            # 3. Extract unique patterns (Weekday, Time, Coach)
            import datetime
            patterns = set()
            for cls in source_classes:
                dt = datetime.datetime.strptime(cls["date"], "%Y-%m-%d")
                weekday = dt.strftime("%A") # "Monday", "Tuesday"...
                time = cls["time"]
                coach = cls.get("coach")
                patterns.add((weekday, time, coach))
            
            # 4. Create series for each pattern
            count = 0
            for (weekday, time, coach) in patterns:
                created = self.create_monthly_series(target_month_str, weekday, time, [], coach)
                count += len(created)
            
            return True, f"Successfully created {count} classes from {source_month_str}"

        except Exception as e:
            return False, str(e)

    def update_player(self, player_id: str, name: str = None, level: int = None, default_days: List[str] = None, makeup_credits: int = None) -> bool:
        player = self.get_player(player_id)
        if not player:
            return False
        
        if name:
            player["name"] = name
        if level is not None:
            player["level"] = level
        if default_days is not None:
            player["default_days"] = default_days
        if makeup_credits is not None:
            player["makeup_credits"] = makeup_credits
            
        self._save_json(self.players, self.players_file)
        return True

    # --- Rescheduling Logic ---
    def remove_student_from_class(self, class_id: str, player_id: str, award_credit: bool = False) -> (bool, str):
        player = self.get_player(player_id)
        if not player:
            return False, "Player not found"
            
        for cls in self.classes:
            if cls["id"] == class_id:
                if player_id in cls["student_ids"]:
                    cls["student_ids"].remove(player_id)
                    # Clean up attendance if exists
                    if "attendance" in cls and player_id in cls["attendance"]:
                        del cls["attendance"][player_id]
                        
                    # REFUND LOGIC:
                    # If this class is NOT in their default_days, assume it used a credit (or was an extra add).
                    # Refund the credit.
                    # We need to reconstruct the "Weekday|Time|Coach" key to check default_days.
                    try:
                        import datetime
                        dt = datetime.datetime.strptime(cls["date"], "%Y-%m-%d")
                        w_day = dt.strftime("%A")
                        c_time = cls["time"]
                        c_coach = cls.get("coach") or "No Coach" # "No Coach" matches frontend format
                        
                        # In default_days strings, coach might be "No Coach" or name.
                        # The generic format is "Day|Time|Coach".
                        # Let's check matches.
                        is_default = False
                        if player.get("default_days"):
                            for d_day in player["default_days"]:
                                parts = d_day.split("|")
                                if len(parts) >= 2:
                                    dy, tm = parts[0], parts[1]
                                    dc = parts[2] if len(parts) > 2 else "No Coach"
                                    
                                    # Compare
                                    if dy == w_day and tm == c_time:
                                        # Compare coach narrowly? Or just day/time?
                                        # Usually specific to coach too.
                                        if dc == c_coach:
                                            is_default = True
                                            break
                                        # Be lenient with "No Coach" vs None?
                                        if (dc == "No Coach" and cls.get("coach") is None):
                                            is_default = True
                                            break
                        
                        if not is_default or award_credit:
                            # It was a makeup or manual add -> Refund
                            player["makeup_credits"] = player.get("makeup_credits", 0) + 1
                            msg = "Player removed, credit refunded"
                        else:
                            msg = "Player removed from default class"

                    except Exception as e:
                         print(f"Error checking default days: {e}")
                         msg = "Player removed (error checking defaults)"
                    
                    self._save_json(self.classes, self.classes_file)
                    self._save_json(self.players, self.players_file)
                    return True, msg
                return False, "Player not in class"
        return False, "Class not found"

    def mark_attendance(self, class_id: str, player_id: str, status: str) -> (bool, str):
        # status: "present" or "absent"
        player = self.get_player(player_id)
        if not player:
            return False, "Player not found"
            
        for cls in self.classes:
            if cls["id"] == class_id:
                if player_id not in cls["student_ids"]:
                    return False, "Player not in class roster"
                
                if "attendance" not in cls:
                    cls["attendance"] = {}
                
                # Check if already marked to avoid double counting stats
                old_status = cls["attendance"].get(player_id)
                if old_status == status:
                    return True, f"Already marked as {status}"

                # Reverse old status effects if applicable
                if old_status == "absent":
                    player["makeup_credits"] = max(0, player.get("makeup_credits", 1) - 1)
                elif old_status == "present":
                    if "stats" in player:
                        player["stats"]["classes_attended"] = max(0, player["stats"].get("classes_attended", 1) - 1)
                    if "attendance_history" in player:
                        player["attendance_history"] = [
                            h for h in player["attendance_history"] 
                            if not (h["date"] == cls["date"] and h["time"] == cls["time"] and h["class_id"] == class_id)
                        ]

                # Apply new status
                if not status or status == "":
                    if player_id in cls["attendance"]:
                        del cls["attendance"][player_id]
                    msg = "Attendance status cleared"
                else:
                    cls["attendance"][player_id] = status
                    if status == "absent":
                        player["makeup_credits"] = player.get("makeup_credits", 0) + 1
                        msg = "Marked absent, makeup added"
                    else:
                        # status == "present"
                        # INCREMENT STATS HERE (Deferred from booking)
                        if "stats" not in player:
                            player["stats"] = {"classes_attended": 0, "makeups_used": 0}
                        
                        player["stats"]["classes_attended"] = player["stats"].get("classes_attended", 0) + 1
                        
                        # Check if this was a makeup class to increment makeups_used
                        # Logic: Not in default_days
                        try:
                            import datetime
                            dt = datetime.datetime.strptime(cls["date"], "%Y-%m-%d")
                            w_day = dt.strftime("%A")
                            c_time = cls["time"]
                            c_coach = cls.get("coach") or "No Coach"
                            
                            is_default = False
                            if player.get("default_days"):
                                for d_day in player["default_days"]:
                                    parts = d_day.split("|")
                                    if len(parts) >= 2:
                                        dy, tm = parts[0], parts[1]
                                        dc = parts[2] if len(parts) > 2 else "No Coach"
                                        if dy == w_day and tm == c_time:
                                            # Loose match on coach to be safe? Or strict?
                                            # If I'm default Monday 10am Coach A, and I attend Monday 10am Coach B -> Is that a makeup?
                                            # Yes, technically.
                                            if dc == c_coach:
                                                is_default = True
                                            if (dc == "No Coach" and cls.get("coach") is None):
                                                is_default = True
                            
                            if not is_default:
                                player["stats"]["makeups_used"] = player["stats"].get("makeups_used", 0) + 1
                                
                        except:
                            pass

                        if "attendance_history" not in player:
                            player["attendance_history"] = []
                        
                        history_entry = {"date": cls["date"], "time": cls["time"], "class_id": class_id, "coach": cls.get("coach")}
                        if history_entry not in player["attendance_history"]:
                            player["attendance_history"].append(history_entry)
                        msg = "Marked present"
                
                self._save_json(self.classes, self.classes_file)
                self._save_json(self.players, self.players_file)
                return True, msg
        return False, "Class not found"

    def mark_absent(self, class_id: str, player_id: str) -> (bool, str):
        # Legacy/Convenience: Now calls mark_attendance
        return self.mark_attendance(class_id, player_id, "absent")



    def find_makeup_options(self, player_id: str, month: Optional[str] = None) -> List[Dict]:
        """
        Find classes where:
        1. Class has space (< 4 students).
        2. All existing students have level <= requesting_player.level.
        3. Matches month (YYYY-MM) if provided.
        """
        player = self.get_player(player_id)
        if not player:
            return []

        player_level = player["level"]
        options = []

        # Create a quick lookup for all players to check levels
        player_map = {p["id"]: p for p in self.players}

        for cls in self.classes:
            # 0. Filter by month if provided
            if month and not cls["date"].startswith(month):
                continue
            # 1. Check Capacity
            # Count only students NOT marked 'absent'
            active_students_count = 0
            for sid in cls["student_ids"]:
                if cls.get("attendance", {}).get(sid) != 'absent':
                    active_students_count += 1
            
            if active_students_count >= cls["max_students"]:
                continue
            
            # Check if player is already in this class
            if player_id in cls["student_ids"]:
                continue

            # 2. Check Level Compatibility
            # The rule: "never a higher level" -> Current students must not be higher than me.
            # If a student in the class is Level 3, and I am Level 2 -> I CANNOT join.
            # So, MAX(class_levels) <= My Level
            
            can_join = True
            current_levels = []
            
            for sid in cls["student_ids"]:
                student = player_map.get(sid)
                if student:
                    current_levels.append(student["level"])
                    if student["level"] > player_level:
                        can_join = False
                        break
            
            if can_join:
                # Enrich with detail for frontend
                options.append({
                    **cls,
                    "current_levels": current_levels
                })
        
        # Sort options by date
        options.sort(key=lambda x: (x["date"], x["time"]))
        return options

    def book_makeup(self, class_id: str, player_id: str, use_credit: bool = False) -> (bool, str):
        player = self.get_player(player_id)
        if not player:
            return False, "Player not found"
            
        if use_credit and player.get("makeup_credits", 0) <= 0:
            return False, "No makeups available"
            
        for cls in self.classes:
            if cls["id"] == class_id:
                # Count only students NOT marked 'absent'
                active_students_count = 0
                for sid in cls["student_ids"]:
                    if cls.get("attendance", {}).get(sid) != 'absent':
                        active_students_count += 1

                if active_students_count >= cls["max_students"]:
                    return False, "Class is full"
                if player_id in cls["student_ids"]:
                    return False, "Player already in class"
                
                cls["student_ids"].append(player_id)
                
                if use_credit:
                    player["makeup_credits"] -= 1
                    # DEFERRED: do not increment stats here. Wait for check-in.
                    # player["stats"]["makeups_used"] = player["stats"].get("makeups_used", 0) + 1
                else:
                    # Regular booking count
                    pass
                    # DEFERRED: player["stats"]["classes_attended"] = player["stats"].get("classes_attended", 0) + 1

                self._save_json(self.classes, self.classes_file)
                self._save_json(self.players, self.players_file)
                return True, "Success"
        return False, "Class not found"

    # --- Target Management ---
    def get_target(self, month: str) -> int:
        return self.monthly_targets.get(month, 8) # Default 8

    def set_target(self, month: str, target: int):
        self.monthly_targets[month] = target
        self._save_json(self.monthly_targets, self.targets_file)

    def calculate_month_stats(self, month: str) -> List[Dict]:
        """
        Returns stats for all students for the given month:
        - Attendance vs Target
        - Absences
        - Rollover Credits (current balance)
        """
        stats = []
        
        # Get all classes for the month
        month_classes = [c for c in self.classes if c["date"].startswith(month)]
        
        for student in self.players:
            student_id = student["id"]
            name = student["name"]
            
            # Get target (default 8)
            target = self.get_target(month)
            
            attended_count = 0
            absences_count = 0
            
            for c in month_classes:
                if "attendance" in c and student_id in c["attendance"]:
                    status = c["attendance"][student_id]
                    if status == "present":
                        attended_count += 1
                    elif status == "absent":
                        absences_count += 1
            
            # Current credits as rollover
            rollover_credits = student.get("makeup_credits", 0)
            
            stats.append({
                "student_id": student_id,
                "name": name,
                "target": target,
                "attended": attended_count,
                "absences": absences_count,
                "rollover_credits": rollover_credits,
                "achieved": attended_count >= target
            })
            
        # Sort by name
        stats.sort(key=lambda x: x["name"])
        return stats
