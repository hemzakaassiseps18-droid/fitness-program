import json
from datetime import datetime

PLAN = {
    "الاثنين": ["تمارين القوة A", "Push-ups", "Squats", "Plank"],
    "الثلاثاء": ["مشي سريع", "تمديد الظهر", "تمديد الساقين"],
    "الأربعاء": ["راحة أو مشي خفيف", "تمدد خفيف", "استرخاء"],
    "الخميس": ["تمارين القوة B", "Lunges", "Deadlifts", "Glute bridge"],
    "الجمعة": ["HIIT", "Jumping Jacks", "Mountain Climbers"],
    "السبت": ["تمارين كاملة الجسم", "Squats", "Push-ups", "Plank"],
    "الأحد": ["راحة كاملة", "تمدد خفيف", "نوم 7-8 ساعات"]
}


def show_plan():
    print("خطة اللياقة الأسبوعية:")
    for day, exercises in PLAN.items():
        print(f"\n{day}:")
        for ex in exercises:
            print(f"- {ex}")


def save_progress(day, exercises_done, water_liters, calories):
    record = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "day": day,
        "exercises_done": exercises_done,
        "water_liters": water_liters,
        "calories": calories,
    }

    try:
        with open("fitness_progress.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = []

    data.append(record)
    with open("fitness_progress.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("تم حفظ تقدم اليوم بنجاح.")


def main():
    show_plan()
    day = input("\nاختر اليوم: ").strip()
    if day not in PLAN:
        print("اليوم غير موجود في الخطة.")
        return

    exercises_done = int(input("كم تمرينًا أكملت؟ "))
    water_liters = float(input("كم لتر ماء شربت؟ "))
    calories = int(input("كم سعر حراري تناولت؟ "))

    save_progress(day, exercises_done, water_liters, calories)
    print(f"\nالملخص:\nاليوم: {day}\nالتمارين: {exercises_done}\nالماء: {water_liters} لتر\nالسعرات: {calories} kcal")


if __name__ == "__main__":
    main()
