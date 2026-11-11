from datetime import date, datetime, time, timedelta


def clock(v):
    return v.strftime("%H:%M") if isinstance(v, time) else str(v)[:5]


def stop_time(start: time, minutes: int):
    return (datetime.combine(date.min, start) + timedelta(minutes=minutes)).time()
