import FoxMascotLoader from "../../components/ui/FoxMascotLoader";

export default function DashboardLoading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px]">
      <FoxMascotLoader
        variant="page"
        size="md"
        message="Loading your workspace..."
      />
    </div>
  );
}
