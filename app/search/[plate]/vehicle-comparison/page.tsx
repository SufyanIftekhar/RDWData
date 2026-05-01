import { VehicleComparisonScreen } from "@/components/vehicle/VehicleComparisonScreen";

type Props = {
  params: { plate: string };
};

export default function VehicleComparisonPage({ params }: Props) {
  return <VehicleComparisonScreen plate={params.plate} />;
}
