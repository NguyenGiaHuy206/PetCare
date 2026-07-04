import { BookingResponse } from "../services/bookings";

const timelineSteps = ["pending", "confirmed", "completed"];
const cancelledStep = "cancelled";

const stepColors: Record<string, string> = {
  pending: "bg-yellow-100 border-yellow-300",
  confirmed: "bg-green-100 border-green-300",
  completed: "bg-blue-100 border-blue-300",
  cancelled: "bg-red-100 border-red-300",
};

const stepTextColors: Record<string, string> = {
  pending: "text-yellow-700",
  confirmed: "text-green-700",
  completed: "text-blue-700",
  cancelled: "text-red-700",
};

export default function BookingTimeline({ booking }: { booking: BookingResponse }) {
  const currentStatus = booking.status.toLowerCase();
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className={`inline-block px-4 py-2 rounded-full font-semibold text-sm ${stepColors[cancelledStep]} ${stepTextColors[cancelledStep]}`}>
            Booking Cancelled
          </div>
          <p className="text-sm text-red-600 mt-2">This booking has been cancelled and will not proceed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Booking Progress</h4>
      <div className="flex items-center justify-between gap-2">
        {timelineSteps.map((step, idx) => {
          const isCompleted = timelineSteps.indexOf(currentStatus) >= idx;
          const isCurrentStep = currentStatus === step;

          return (
            <div key={step} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-xs ${
                    isCompleted
                      ? `${stepColors[step]} ${stepTextColors[step]}`
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  } ${isCurrentStep ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                >
                  {isCompleted ? "✓" : String(idx + 1)}
                </div>
                <span className={`text-xs font-medium mt-1 capitalize ${isCompleted ? stepTextColors[step] : "text-gray-400"}`}>
                  {step}
                </span>
              </div>
              {idx < timelineSteps.length - 1 && (
                <div className={`w-8 h-1 mx-1 ${isCompleted ? "bg-gray-300" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        {currentStatus === "pending" && "Awaiting admin confirmation..."}
        {currentStatus === "confirmed" && "Confirmed! Waiting to be completed..."}
        {currentStatus === "completed" && "Service completed successfully."}
      </p>
    </div>
  );
}
