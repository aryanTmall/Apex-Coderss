from datetime import datetime, timezone, timedelta
import threading

class SimClockService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(SimClockService, cls).__new__(cls)
                    cls._instance._offset = timedelta(seconds=0)
        return cls._instance

    def now(self) -> datetime:
        """Returns the simulated current UTC time (timezone-aware)."""
        return datetime.now(timezone.utc) + self._offset

    def now_naive(self) -> datetime:
        """Returns simulated time without tzinfo for SQLite compatibility if needed."""
        return self.now().replace(tzinfo=None)

    def advance(self, minutes: int) -> datetime:
        """Advances the simulation clock by the specified number of minutes."""
        with self._lock:
            self._offset += timedelta(minutes=minutes)
            return self.now()

    def reset(self):
        """Resets the simulation clock back to real UTC time."""
        with self._lock:
            self._offset = timedelta(seconds=0)

    @property
    def offset_minutes(self) -> float:
        return self._offset.total_seconds() / 60.0

sim_clock = SimClockService()
