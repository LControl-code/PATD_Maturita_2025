import os
from datetime import datetime, timezone, timedelta
import random
import string
import time
import sys
import select
import msvcrt

from dotenv import load_dotenv
from pocketbase import PocketBase

# Load environment variables from .env
load_dotenv()

POCKETBASE_URL = os.environ.get("POCKETBASE_URL")
ADMIN_EMAIL = os.environ.get("PB_ADMIN_EMAIL")
ADMIN_PASS = os.environ.get("PB_ADMIN_PASS")

# Initialize the PocketBase client
pb = PocketBase(POCKETBASE_URL)

# Authenticate as admin
try:
    pb.admins.auth_with_password(ADMIN_EMAIL, ADMIN_PASS)
except Exception as e:
    print(f"Admin authentication failed: {e}")
    sys.exit(1)

# ------------------------------------------------------------------
# 1) Helper functions to get or create lines, stations, device_types
# ------------------------------------------------------------------

def get_or_create_line(line_name: str):
    """Finds (or creates) a line record by its name."""
    try:
        record = pb.collection("lines").get_first_list_item(f'name="{line_name}"')
        return record
    except:
        # Create a new line if it doesn't exist
        return pb.collection("lines").create({"name": line_name})

def get_or_create_station(station_name: str, line_id: str):
    """Finds (or creates) a station record by station name and line."""
    # Filter by name + line
    filter_str = f'name="{station_name}" && line="{line_id}"'
    try:
        record = pb.collection("stations").get_first_list_item(filter_str)
        return record
    except:
        # Create new station
        return pb.collection("stations").create({
            "name": station_name,
            "line": line_id
        })

def get_or_create_device_type(type_name: str):
    """Finds (or creates) a device_type record by name."""
    try:
        record = pb.collection("device_types").get_first_list_item(f'name="{type_name}"')
        return record
    except:
        return pb.collection("device_types").create({"name": type_name})

# ------------------------------------------------------------------
# 2) Station limits definition (same as your original dictionary)
# ------------------------------------------------------------------
station_limits = {
  "A20": {
    "EFAD": {
      "NTC1_Res": (12, 5),
      "HiPot_1_UVW_G_NTC": (10, 3),
      "HiPot_2_NTC_G": (10, 0.02),
      "IR_1_UVW_G_NTC": (550, 10),
      "IR_2_NTC_G": (550, 30),
      "Surge_U_VW_L_Vale": (12, 0),
      "Surge_V_WU_L_Vale": (12, 0),
      "Surge_W_UV_L_Vale": (12, 0),
      "Offset_NTC1_Res": (12.481, 8.07),
      "Offset_NTC1_Temp": (30, 2),
      "Offset_NTC2_Res": (12.481, 8.07),
      "Offset_NTC2_Temp": (30, 2)
    },
    "ERAD": {
      "NTC1_Res": (12, 5),
      "HiPot_1_UVW_G_NTC": (12, 3),
      "HiPot_2_NTC_G": (12, 0.02),
      "IR_1_UVW_G_NTC": (550, 10),
      "IR_2_NTC_G": (550, 30),
      "Surge_U_VW_L_Vale": (12, 0),
      "Surge_V_WU_L_Vale": (12, 0),
      "Surge_W_UV_L_Vale": (12, 0),
      "Offset_NTC1_Res": (12.481, 8.07),
      "Offset_NTC1_Temp": (30, 2),
      "Offset_NTC2_Res": (12.481, 8.07),
      "Offset_NTC2_Temp": (30, 2)
    },
  },
  "A25": {
    "EFAD": {
      "Offset_NTC1_Res": (12.481, 8.07),
      "Offset_NTC1_Temp": (30, 2),
      "Offset_NTC2_Res": (12.481, 8.07),
      "Offset_NTC2_Temp": (30, 2),
      "Offset_Cos__and_Cos": (31.08, 28.12),
      "Offset_Sin__and_Sin": (28.35, 25.65),
      "Offset_Exc__and_Exc": (14.49, 13.11),
      "Cos__and_Sin_": (10000, 0),
      "Sin__and_Exc_": (10000, 0),
      "Cos_and_Sin": (10000, 0),
      "Sin_and_Exc": (10000, 0),
      "Offset_PCBA_Ground": (0.7, 0)
    },
    "ERAD": {
      "Offset_NTC1_Res": (12.481, 8.07),
      "Offset_NTC1_Temp": (30, 2),
      "Offset_NTC2_Res": (12.481, 8.07),
      "Offset_NTC2_Temp": (30, 2),
      "Offset_Cos__and_Cos": (31.08, 28.12),
      "Offset_Sin__and_Sin": (28.35, 25.65),
      "Offset_Exc__and_Exc": (14.49, 13.11),
      "Cos__and_Sin_": (10000, 0),
      "Sin__and_Exc_": (10000, 0),
      "Cos_and_Sin": (10000, 0),
      "Sin_and_Exc": (10000, 0),
      "Offset_PCBA_Ground": (0.7, 0)
    },
    "Short": {
      "Offset_NTC1_Res": (12.481, 8.07),
      "Offset_NTC1_Temp": (30, 2),
      "Offset_NTC2_Res": (12.481, 8.07),
      "Offset_NTC2_Temp": (30, 2),
      "Offset_Cos__and_Cos": (31.08, 28.12),
      "Offset_Sin__and_Sin": (28.35, 25.65),
      "Offset_Exc__and_Exc": (14.49, 13.11),
      "Cos__and_Sin_": (10000, 0),
      "Sin__and_Exc_": (10000, 0),
      "Cos_and_Sin": (10000, 0),
      "Sin_and_Exc": (10000, 0),
      "Offset_PCBA_Ground": (0.7, 0)
    }
  },
  "A26": {
    "EFAD": {
      "Lineraity": (1, -1),
      "OffsetAngle": (-28, -68),
      "PhaseSequence": (1, 0.1),
      "NTC1_Res": (18.052, 5.801),
      # "NTC1_Temp": None,
      # "TempCoefficient": None,
      "Offset_UV_Vpeak": (48.7911, 45.9489),
      "Offset_VW_Vpeak": (48.7911, 45.9489),
      "Offset_WU_Vpeak": (48.7911, 45.9489),
      "Un_UV": (1, -1),
      "Un_VW": (1, -1),
      "Un_WU": (1, -1),
      "THD": (1.5, 0.1),
      # "RPM": None
    },
    "ERAD": {
      "Lineraity": (1, -1),
      "OffsetAngle": (188, 148),
      "PhaseSequence": (1, 0.1),
      "NTC1_Res": (18.052, 5.801),
      # "NTC1_Temp": None,
      # "TempCoefficient": None,
      "Offset_UV_Vpeak": (57.989, 54.611),
      "Offset_VW_Vpeak": (57.989, 54.611),
      "Offset_WU_Vpeak": (57.989, 54.611),
      "Un_UV": (1, -1),
      "Un_VW": (1, -1),
      "Un_WU": (1, -1),
      "THD": (1.5, 0.1),
      # "RPM": None
    },
    "Short": {
      "Lineraity": (1, -1),
      "OffsetAngle": (188, 148),
      "PhaseSequence": (1, 0.1),
      "NTC1_Res": (18.052, 5.801),
      # "NTC1_Temp": None,
      # "TempCoefficient": None,
      "Offset_UV_Vpeak": (48.7911, 45.9489),
      "Offset_VW_Vpeak": (48.7911, 45.9489),
      "Offset_WU_Vpeak": (48.7911, 45.9489),
      "Un_UV": (1, -1),
      "Un_VW": (1, -1),
      "Un_WU": (1, -1),
      "THD": (1.5, 0.1),
      # "RPM": None
    }
  },
  "S02": {
    "EFAD": {
      "NTC1_Res": (18.052, 8.07),
      # "NTC1_Temp": None,
      "NTC2_Res": (18.052, 8.07),
      # "NTC2_Temp": None,
      # "WR_UV_Res": None,
      # "WR_VW_Res": None,
      # "WR_WU_Res": None,
      "Offset_WR_UV_Res": (14.42, 13.58),
      "Offset_WR_VW_Res": (14.42, 13.58),
      "Offset_WR_WU_Res": (14.42, 13.58),
      "Un_UV": (1, -1),
      "Un_VW": (1, -1),
      "Un_WU": (1, -1),
      "Surge_U_VW_AreaDiff": (5, -5),
      "Surge_V_WU_AreaDiff": (5, -5),
      "Surge_W_UV_AreaDiff": (5, -5),
      "Surge_U_VW_DiffArea": (15, 0),
      "Surge_V_WU_DiffArea": (15, 0),
      "Surge_W_UV_DiffArea": (15, 0),
      "Surge_U_VW_L_Vale": (12, 0),
      "Surge_V_WU_L_Vale": (12, 0),
      "Surge_W_UV_L_Vale": (12, 0),
      "IR_1_UVW_G_NTC": (550, 20),
      "IR_2_NTC_G": (550, 50),
      "HiPot_1_UVW_G_NTC": (7.3, 3),
      "HiPot_2_NTC_G": (10, 0.02)
    },
    "ERAD": {
      "NTC1_Res": (18.052, 8.07),
      # "NTC1_Temp": None,
      "NTC2_Res": (18.052, 8.07),
      # "NTC2_Temp": None,
      # "WR_UV_Res": None,
      # "WR_VW_Res": None,
      # "WR_WU_Res": None,
      "Offset_WR_UV_Res": (13.699, 12.901),
      "Offset_WR_VW_Res": (13.699, 12.901),
      "Offset_WR_WU_Res": (13.699, 12.901),
      "Un_UV": (1, -1),
      "Un_VW": (1, -1),
      "Un_WU": (1, -1),
      "Surge_U_VW_AreaDiff": (5, -5),
      "Surge_V_WU_AreaDiff": (5, -5),
      "Surge_W_UV_AreaDiff": (5, -5),
      "Surge_U_VW_DiffArea": (15, 0),
      "Surge_V_WU_DiffArea": (15, 0),
      "Surge_W_UV_DiffArea": (15, 0),
      "Surge_U_VW_L_Vale": (12, 0),
      "Surge_V_WU_L_Vale": (12, 0),
      "Surge_W_UV_L_Vale": (12, 0),
      "IR_1_UVW_G_NTC": (550, 20),
      "IR_2_NTC_G": (550, 50),
      "HiPot_1_UVW_G_NTC": (9, 3),
      "HiPot_2_NTC_G": (12, 0.02)
    },
  },
  "NVH": {
    "EFAD": {
      "Vibration": (1, 1),
      "No_Load_Current": (9, 1),
      "DC_bus": (1000, 1),
      "Out_Voltage": (1000, 1),
      "Out_PowerkW": (1000, 1),
      "Up_side_Air": (0.8, 0.3),
      "Acc_1_Air": (0.8, 0.3),
      "Acc_2_Air": (0.8, 0.3),
      "Acc_3_Air": (0.8, 0.3),
    },
    "ERAD": {
      "Vibration": (1, 1),
      "No_Load_Current": (9, 1),
      "DC_bus": (1000, 1),
      "Out_Voltage": (1000, 1),
      "Out_PowerkW": (1000, 1),
      "Up_side_Air": (0.8, 0.3),
      "Acc_1_Air": (0.8, 0.3),
      "Acc_2_Air": (0.8, 0.3),
      "Acc_3_Air": (0.8, 0.3),
    },
    "Short": {
      "Vibration": (1, 1),
      "No_Load_Current": (9, 1),
      "DC_bus": (1000, 1),
      "Out_Voltage": (1000, 1),
      "Out_PowerkW": (1000, 1),
      "Up_side_Air": (0.8, 0.3),
      "Acc_1_Air": (0.8, 0.3),
      "Acc_2_Air": (0.8, 0.3),
      "Acc_3_Air": (0.8, 0.3),
    }
  },
  "R23": {
    "EFAD": {
      "L12": (1.75, 0.75),
      "L13": (3.125, 1.875),
      "L14": (4.375, 3.125),
      "L15": (5.8, 4.2),
      "L16": (7.05, 5.45),
      "Start_Temp": (40, 10),
      "Finish_Temp": (40, 10),
      # "TempCoefficient": None,
      "Offset_UV_Vpeak": (37.389, 35.211),
      "Offset_VW_Vpeak": (37.389, 35.211),
      "Offset_WU_Vpeak": (37.389, 35.211),
      "THD": (1.5, 0.1),
      "L12_1": (1.75, 0.75),
      "L23": (1.75, 0.75),
      "L34": (1.75, 0.75),
      "L45": (1.75, 0.75),
      "L56": (1.75, 0.75),
      "Origin_UV_Vpeak": (42.848, 40.352),
      "Origin_VW_Vpeak": (42.848, 40.352),
      "Origin_WU_Vpeak": (42.848, 40.352),
      "Un_UV": (1, -1),
      "Un_VW": (1, -1),
      "Un_WU": (1, -1),
      # "THD_UV": None,
      # "THD_VW": None,
      # "THD_WU": None,
      # "RPM": None
    },
    "ERAD": {
      "L12": (1.75, 0.75),
      "L13": (3.125, 1.875),
      "L14": (4.375, 3.125),
      "L15": (5.8, 4.2),
      "L16": (7.05, 5.45),
      "Start_Temp": (40, 10),
      "Finish_Temp": (40, 10),
      # "TempCoefficient": None,
      "Offset_UV_Vpeak": (37.389, 35.211),
      "Offset_VW_Vpeak": (37.389, 35.211),
      "Offset_WU_Vpeak": (37.389, 35.211),
      "THD": (1.5, 0.1),
      "L12_1": (1.75, 0.75),
      "L23": (1.75, 0.75),
      "L34": (1.75, 0.75),
      "L45": (1.75, 0.75),
      "L56": (1.75, 0.75),
      "Origin_UV_Vpeak": (42.848, 40.352),
      "Origin_VW_Vpeak": (42.848, 40.352),
      "Origin_WU_Vpeak": (42.848, 40.352),
      "Un_UV": (1, -1),
      "Un_VW": (1, -1),
      "Un_WU": (1, -1),
      # "THD_UV": None,
      # "THD_VW": None,
      # "THD_WU": None,
      # "RPM": None
    },
  }
}

# Two lines in your environment
LINES = ["Line 1", "Line 2"]

# ------------------------------------------------------------------
# 3) Main loop: generate data, pick line & station, create test_data
# ------------------------------------------------------------------
try:
    while True:
        motor_type = random.choice(["EFAD", "ERAD", "Short"])

        # Generate a random device code
        device_code = (
            f"P{random.randint(10000000, 99999999)}"
            f"#1TF{random.randint(10000000, 99999999)}"
            f"#{''.join(random.choices(string.ascii_uppercase, k=6))}#"
        )

        i = 0
        # For each station in your dictionary
        for station_name in station_limits.keys():
            # Also do it for both lines (Line 1 and Line 2)
            for line_name in LINES:
                # 1) Get or create the line record
                line_record = get_or_create_line(line_name)

                # 2) Get or create the station record
                station_record = get_or_create_station(station_name, line_record.id)

                # If the station doesn't have the chosen motor_type, skip
                # (In your original code, some stations might not have "Short", etc.)
                if motor_type not in station_limits[station_name]:
                    continue

                # 3) Get or create the device_type
                device_type_record = get_or_create_device_type(motor_type)

                # 4) Decide if this test fails
                test_fail_bool = (random.random() < 0.3)  # 30% chance of failure

                # 5) Prepare the record for test_data
                entry_data = {
                    "time": (datetime.now(timezone.utc) + timedelta(minutes=i * 2)).isoformat(),
                    "device_code": device_code,
                    "test_fail": test_fail_bool,
                    "station": station_record.id,
                    "device_type": device_type_record.id,
                }

                # We'll store actual measurement values in a JSON field "test_data"
                # This matches our new schema's "test_data" (json).
                measurements = {}

                # 6) Generate random values for the station's motor_type limits
                limits = station_limits[station_name][motor_type]
                if test_fail_bool:
                    # Randomly select tests to fail
                    num_fail_tests = random.randint(1, max(1, len(limits) - 5))
                    fail_tests = random.sample(list(limits.keys()), num_fail_tests)

                    for key, (high, low) in limits.items():
                        if key in fail_tests:
                            # Out-of-bounds
                            if random.choice([True, False]):
                                measurements[key] = round(random.uniform(low - 1, low - 0.1), 3)
                            else:
                                measurements[key] = round(random.uniform(high + 0.1, high + 1), 3)
                        else:
                            # Within bounds
                            measurements[key] = round(random.uniform(low, high), 3)
                else:
                    # All within bounds
                    for key, (high, low) in limits.items():
                        measurements[key] = round(random.uniform(low, high), 3)

                # Put this dictionary into "test_data" field
                entry_data["test_data"] = measurements

                # 7) Create the new test_data record in PocketBase
                try:
                    created_test_data = pb.collection("test_data").create(entry_data)
                    print(f"time: {entry_data['time']}, device_code: {entry_data['device_code']}, test_fail: {test_fail_bool}")

                    # 8) If test_fail is True, create corresponding "failures" records
                    if test_fail_bool:
                        # Identify which keys were actually out-of-bounds
                        for param, value in measurements.items():
                            (hi, lo) = limits[param]
                            if not (lo <= value <= hi):
                                # Compute offset
                                offset = 0
                                fail_type = ""
                                if value < lo:
                                    offset = lo - value
                                    fail_type = "below"
                                elif value > hi:
                                    offset = value - hi
                                    fail_type = "above"

                                # Insert a record into the "failures" collection
                                failure_data = {
                                    "test_data": created_test_data.id,
                                    "station": station_record.id,
                                    "device_type": device_type_record.id,
                                    "test": param,
                                    "limit": hi if value > hi else lo,
                                    "value": value,
                                    "offset": round(offset, 3),
                                    "type": fail_type,
                                    "time": entry_data["time"],
                                }
                                pb.collection("failures").create(failure_data)

                except Exception as e:
                    print(f"Error creating test_data/failures: {e}")
                    print(f"Entry data: {entry_data}")

                i += 1

        # Sleep for a random duration between 1.5 and 3 minutes
        sleep_duration = round(random.uniform(90, 180), 2)
        print(f"Sleeping for {sleep_duration} seconds (press Enter to skip)", end="\r")

        start_time = time.time()
        while time.time() - start_time < sleep_duration:
            if msvcrt.kbhit():
                msvcrt.getch()  # Clear the key press
                break
            time.sleep(1)

except KeyboardInterrupt:
    print("\nGracefully shutting down...")
    sys.exit(0)
