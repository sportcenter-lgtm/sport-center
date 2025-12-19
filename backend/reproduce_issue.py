
import os
import datetime
from schedule_manager import ScheduleManager

# Setup temp files
PLAYERS_FILE = "temp_players.json"
CLASSES_FILE = "temp_classes.json"

if os.path.exists(PLAYERS_FILE): os.remove(PLAYERS_FILE)
if os.path.exists(CLASSES_FILE): os.remove(CLASSES_FILE)

# Initialize Manager
manager = ScheduleManager(players_file=PLAYERS_FILE, classes_file=CLASSES_FILE)

print("--- Test 1: Add Student with Enrollment ---")
# 1. Create a class
# Wednesday Jan 1 2025
cls = manager.create_class("2025-01-01", "10:00", [], "Alice")
print(f"Created Class: {cls['id']} {cls['date']} {cls['time']} {cls['coach']}")

# 2. Add Player with Enrollment
# Frontend logic: calls add_player then batch_enroll
player = manager.add_player("Bob", 1, ["Wednesday|10:00|Alice"])
print(f"Created Player: {player['name']}")

# Enroll
count = manager.batch_enroll(player['id'], "2025-01", "Wednesday", "10:00", "Alice")
print(f"Enrolled in {count} classes")

# Verify
updated_cls = manager.get_classes()[0]
if player['id'] in updated_cls['student_ids']:
    print("PASS: Bob is in class")
else:
    print("FAIL: Bob is NOT in class")

print("\n--- Test 2: Edit Class (Add Student to Roster) ---")
# Create another student
charlie = manager.add_player("Charlie", 1, [])
# Update class to include Charlie and Bob
success = manager.update_class(cls['id'], student_ids=[player['id'], charlie['id']])
updated_cls_2 = manager.get_classes()[0]
if charlie['id'] in updated_cls_2['student_ids']:
    print("PASS: Charlie added via update_class")
else:
    print("FAIL: Charlie NOT added via update_class")


print("\n--- Test 3: Edit Player (Remove Class from Defaults) ---")
# Bob was default enrolled. Remove default day.
# Backend update_player
manager.update_player(player['id'], default_days=[])
updated_player = manager.get_player(player['id'])
print(f"Player Default Days: {updated_player['default_days']}")

# Verify if removed from class
updated_cls_3 = manager.get_classes()[0]
if player['id'] in updated_cls_3['student_ids']:
    print("FAIL: Bob is STILL in class after removing default_day (Expected behavior based on code analysis)")
else:
    print("PASS: Bob was removed from class")

print("\n--- Test 4: Coach Matching (None vs Value) ---")
# Create class with NO coach
cls_nocoach = manager.create_class("2025-01-08", "10:00", [], None) # Next Wed
# Enroll Bob with coach="Alice" - Should NOT enroll in NoCoach class?
# Assuming 2025-01 includes Jan 08.
cnt = manager.batch_enroll(player['id'], "2025-01", "Wednesday", "10:00", "Alice") 
# Bob is player_id. 
updated_cls_nc = [c for c in manager.get_classes() if c['id'] == cls_nocoach['id']][0]
if player['id'] in updated_cls_nc['student_ids']:
    print("FAIL: Bob enrolled in NoCoach class despite asking for Alice")
else:
    print("PASS: Bob correctly not enrolled in NoCoach class")

# Enroll Bob with coach=None (Any/No Coach?)
cnt2 = manager.batch_enroll(player['id'], "2025-01", "Wednesday", "10:00", None)
updated_cls_nc2 = [c for c in manager.get_classes() if c['id'] == cls_nocoach['id']][0]
if player['id'] in updated_cls_nc2['student_ids']:
    print("PASS: Bob enrolled in NoCoach class with coach=None")
else:
    print("FAIL: Bob NOT enrolled in NoCoach class with coach=None")

# Does coach=None match Alice?
updated_cls_alice = [c for c in manager.get_classes() if c['id'] == cls['id']][0]
if player['id'] in updated_cls_alice['student_ids']:
    print("FAIL: Bob enrolled in Alice class with coach=None (Strict matching failed)")
else:
    print("PASS: Bob correctly NOT enrolled in Alice class with coach=None (Strict matching worked)")

print("\n--- Test 5: Batch Unenroll ---")
# Enroll Bob in Alice's class explicitly
manager.batch_enroll(player['id'], "2025-01", "Wednesday", "10:00", "Alice")
# Verify he is there
if player['id'] in manager.get_classes()[0]['student_ids']:
    print("Setup: Bob is in Alice's class")
else:
    print("Setup FAIL: Could not enroll Bob")

# Now Unenroll
count = manager.batch_unenroll(player['id'], "2025-01", "Wednesday", "10:00", "Alice")
print(f"Unenrolled count: {count}")

# Verify he is gone
if player['id'] not in manager.get_classes()[0]['student_ids']:
    print("PASS: Bob successfully unenrolled")
else:
    print("FAIL: Bob is still in the class")

print("\n--- Test 6: Makeup Credit Refund & Deferred Stats ---")

# 1. Give player a credit
player = manager.get_player(player['id'])
player["makeup_credits"] = 1
if "stats" not in player: player["stats"] = {}
player["stats"]["makeups_used"] = 0
player["stats"]["classes_attended"] = 0
manager._save_json(manager.players, manager.players_file)
print("Reset player credits to 1, stats to 0.")

# 2. Book makeup (use_credit=True)
# Use class index 0 (Monday aka Alice's class which is Wed here? Wait, cls is Wed-10:00)
# Bob was removed from it in Test 5. So he's not in it.
target_cls = manager.get_classes()[0]
success, msg = manager.book_makeup(target_cls['id'], player['id'], use_credit=True)
print(f"Book Makeup Result: {success}, {msg}")

player = manager.get_player(player['id'])
print(f"Credits after book (Expected 0): {player['makeup_credits']}")
print(f"Makeups Used after book (Expected 0 - Deferred): {player['stats'].get('makeups_used', 0)}")

if player['makeup_credits'] == 0 and player['stats'].get('makeups_used', 0) == 0:
    print("PASS: Booking deferred stats and deducted credit.")
else:
    print(f"FAIL: Booking logic incorrect. Credits: {player['makeup_credits']} (Exp 0), MakeupsUsed: {player['stats'].get('makeups_used')} (Exp 0)")

# 3. Mark Present -> Check Stats
manager.mark_attendance(target_cls['id'], player['id'], "present")
player = manager.get_player(player['id'])
print(f"Makeups Used after Present (Expected 1): {player['stats'].get('makeups_used', 0)}")
print(f"Classes Attended after Present (Expected 1): {player['stats'].get('classes_attended', 0)}")

if player['stats'].get('makeups_used', 0) == 1:
    print("PASS: Attendance incremented makeup stats.")
else:
    print("FAIL: Attendance did NOT increment makeup stats.")

# 4. Remove Student -> Check Refund
# Reset credit to 0 to test refund
player["makeup_credits"] = 0
manager._save_json(manager.players, manager.players_file)

# Remove from class. logic: if not in default_days (list is empty/removed in test 3), refund.
manager.remove_student_from_class(target_cls['id'], player['id'])
player = manager.get_player(player['id'])
print(f"Credits after removal (Expected 1 - Refunded): {player['makeup_credits']}")

if player['makeup_credits'] == 1:
    print("PASS: Removal refunded credit.")
else:
    print("FAIL: Removal did NOT refund credit.")


# Cleanup
if os.path.exists(PLAYERS_FILE): os.remove(PLAYERS_FILE)
if os.path.exists(CLASSES_FILE): os.remove(CLASSES_FILE)
