
import requests
import uuid
import datetime

API_URL = "http://localhost:8000"

def verify_fix():
    print("Setting up test data...")
    # 1. Create two classes on Fridays in March 2026 at 10:00 AM
    # Class 1: 2026-03-06
    # Class 2: 2026-03-13
    
    # Clean up first (optional but safer to just use new unique month if possible, but hard to predict)
    # We'll rely on unique IDs.
    
    date1 = "2026-03-06"
    date2 = "2026-03-13"
    time_original = "10:00"
    time_new = "11:00"
    
    # Create Class A
    res1 = requests.post(f"{API_URL}/scheduler/classes/series", json={
        "month": "2026-03", "weekday": "Friday", "time": time_original, "coach": "Original", "student_ids": [], "max_students": 4
    })
    
    # Get IDs
    classes = requests.get(f"{API_URL}/scheduler/classes?month=2026-03").json()
    c1 = next((c for c in classes if c["date"] == date1 and c["time"] == time_original), None)
    c2 = next((c for c in classes if c["date"] == date2 and c["time"] == time_original), None)
    
    if not c1 or not c2:
        print("Failed to create test slots")
        return

    print(f"Created Class 1: {c1['id']} ({c1['time']})")
    print(f"Created Class 2: {c2['id']} ({c2['time']})")
    
    # 2. Update Class 1: Change time to 11:00 AND Propagate
    # Frontend logic: 
    #   patch /classes/{id} -> update self to 11:00
    #   post /classes/{id}/propagate?match_time=10:00 -> find others at 10:00 and make them 11:00
    
    print("Simulating Frontend Update...")
    # Step A: Update Class 1
    requests.patch(f"{API_URL}/scheduler/classes/{c1['id']}", json={
        "date": date1, "time": time_new, "coach": "NewCoach", "student_ids": [], "max_students": 5
    })
    
    # Step B: Propagate with match_time=10:00
    print(f"Propagating with match_time={time_original}...")
    res = requests.post(f"{API_URL}/scheduler/classes/{c1['id']}/propagate?match_time={time_original}")
    print("Propagate response:", res.json())
    
    # 3. Verify Class 2
    classes_new = requests.get(f"{API_URL}/scheduler/classes?month=2026-03").json()
    c2_updated = next((c for c in classes_new if c["id"] == c2['id']), None)
    
    print(f"Class 2 Time: {c2_updated['time']} (Expected {time_new})")
    print(f"Class 2 Coach: {c2_updated['coach']} (Expected NewCoach)")
    print(f"Class 2 Max: {c2_updated['max_students']} (Expected 5)")
    
    if c2_updated['time'] == time_new and c2_updated['coach'] == "NewCoach":
        print("SUCCESS: Propagation works with time change!")
    else:
        print("FAILURE: Propagation did not update sibling class correctly.")

if __name__ == "__main__":
    verify_fix()
