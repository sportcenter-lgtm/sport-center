import json
import os
from typing import Optional, Dict

class UserManager:
    def __init__(self, storage_file="users.json"):
        self.storage_file = storage_file
        self.users = self._load_users()

    def _load_users(self) -> Dict:
        if not os.path.exists(self.storage_file):
            return {}
        try:
            with open(self.storage_file, "r") as f:
                return json.load(f)
        except:
            return {}

    def _save_users(self):
        temp_file = f"{self.storage_file}.tmp"
        try:
            with open(temp_file, "w") as f:
                json.dump(self.users, f, indent=4)
                f.flush()
                os.fsync(f.fileno())
            os.replace(temp_file, self.storage_file)
        except Exception as e:
            print(f"Error saving {self.storage_file}: {e}")
            if os.path.exists(temp_file):
                os.remove(temp_file)

    def create_user(self, username, password, email, name, sport="beach tennis", role="user"):
        if username in self.users:
            return False, "Username already exists"
        
        # Generate 6-digit verification code
        import secrets
        verification_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        self.users[username] = {
            "password": password, # In production, verify hash!
            "email": email,
            "name": name,
            "sport": sport,
            "role": role,
            "is_verified": False,
            "verification_code": verification_code
        }
        self._save_users()
        
        # In a real app, send this via email
        print(f"\n[EMAIL SIMULATION] Verification Code for {email}: {verification_code}\n")
        
        # Log to file for easier access
        with open("verification_codes.txt", "a") as f:
            f.write(f"Email: {email} | Code: {verification_code}\n")
        
        return True, "User created successfully. Please verify your email."

    def verify_user(self, username, code):
        user = self.users.get(username)
        if not user:
            return False, "User not found"
        
        if user.get("is_verified", False):
            return True, "User already verified"
            
        if user.get("verification_code") == code:
            user["is_verified"] = True
            # Optional: Clear code after verification
            # del user["verification_code"] 
            self._save_users()
            return True, "Email verified successfully"
        
        return False, "Invalid verification code"

    def create_default_admin(self):
        if "llorhan" not in self.users:
            print("Creating default admin account...")
            self.create_user("llorhan", "llorhan123", "llorhan@example.com", "Llorhan (Admin)", "beach tennis", "admin")
        
        # Ensure admin is always verified
        if not self.users["llorhan"].get("is_verified"):
            self.users["llorhan"]["is_verified"] = True
            self._save_users()

    def get_all_users(self):
        # Return list of users without passwords
        users_list = []
        for username, data in self.users.items():
            user_data = data.copy()
            user_data["username"] = username
            if "password" in user_data:
                del user_data["password"]
            if "reset_token" in user_data:
                del user_data["reset_token"]
            # Keep verification_code so admin can see it
            users_list.append(user_data)
        return users_list

    def update_user(self, username, data):
        if username not in self.users:
            return False, "User not found"
        
        # Update fields
        if "name" in data: self.users[username]["name"] = data["name"]
        if "email" in data: self.users[username]["email"] = data["email"]
        if "sport" in data: self.users[username]["sport"] = data["sport"]
        if "role" in data: self.users[username]["role"] = data["role"]
        if "password" in data: self.users[username]["password"] = data["password"] # In prod, hash this!
        
        self._save_users()
        return True, "User updated successfully"

    def delete_user(self, username):
        if username not in self.users:
            return False, "User not found"
        
        del self.users[username]
        self._save_users()
        return True, "User deleted successfully"

    # --- Student Management ---
    def add_student(self, parent_username, student_name, student_email, sport="beach tennis"):
        if parent_username not in self.users:
            return False, "Parent user not found"
        
        parent = self.users[parent_username]
        if "students" not in parent:
            parent["students"] = []
            
        # Generate simple ID
        import uuid
        student_id = str(uuid.uuid4())[:8]
        
        new_student = {
            "id": student_id,
            "name": student_name,
            "email": student_email,
            "sport": sport,
            "created_at": "now" # In prod use datetime
        }
        
        parent["students"].append(new_student)
        self._save_users()
        return True, new_student

    def get_students(self, parent_username):
        if parent_username not in self.users:
            return []
        return self.users[parent_username].get("students", [])

    def update_student(self, parent_username, student_id, data):
        if parent_username not in self.users:
            return False, "Parent user not found"
            
        parent = self.users[parent_username]
        if "students" not in parent:
            return False, "Student not found"
            
        student_idx = -1
        for i, s in enumerate(parent["students"]):
            if s["id"] == student_id:
                student_idx = i
                break
        
        if student_idx == -1:
            return False, "Student not found"
            
        # Update fields
        if "name" in data: parent["students"][student_idx]["name"] = data["name"]
        if "email" in data: parent["students"][student_idx]["email"] = data["email"]
        if "sport" in data: parent["students"][student_idx]["sport"] = data["sport"]
        if "weaknesses" in data: parent["students"][student_idx]["weaknesses"] = data["weaknesses"]
        
        self._save_users()
        return True, "Student updated successfully"

    def delete_student(self, parent_username, student_id):
        if parent_username not in self.users:
            return False, "Parent user not found"
            
        parent = self.users[parent_username]
        if "students" not in parent:
            return False, "Student not found"
            
        initial_len = len(parent["students"])
        parent["students"] = [s for s in parent["students"] if s["id"] != student_id]
        
        if len(parent["students"]) == initial_len:
            return False, "Student not found"
            
        self._save_users()
        return True, "Student deleted"

    def authenticate(self, username, password):
        user = self.users.get(username)
        if not user:
            return False, "User not found"
        
        if user["password"] == password:
            if not user.get("is_verified", False):
                return False, "Email not verified"
            return True, user
        
        return False, "Invalid password"

    def get_user(self, username):
        return self.users.get(username)

    def generate_reset_token(self, email):
        # Find user by email
        target_user = None
        target_username = None
        
        for username, data in self.users.items():
            if data.get("email") == email:
                target_user = data
                target_username = username
                break
        
        if not target_user:
            return False, "Email not found"
            
        # Generate simple token (in prod use UUID or JWT)
        import secrets
        token = secrets.token_urlsafe(16)
        
        # Save token to user record
        self.users[target_username]["reset_token"] = token
        self._save_users()
        
        return True, token

    def reset_password(self, token, new_password):
        # Find user with this token
        target_username = None
        
        for username, data in self.users.items():
            if data.get("reset_token") == token:
                target_username = username
                break
        
        if not target_username:
            return False, "Invalid or expired token"
            
        # Update password and clear token
        self.users[target_username]["password"] = new_password
        if "reset_token" in self.users[target_username]:
            del self.users[target_username]["reset_token"]
            
        self._save_users()
        return True, "Password updated successfully"
