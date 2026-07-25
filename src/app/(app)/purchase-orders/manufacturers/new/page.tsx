import Container from "@/components/common/Container";
import DetailPageHeader from "@/components/common/DetailPageHeader";
import ManufacturerForm from "@/components/ManufacturerForm";

export default function NewManufacturerPage() {
    return (
        <div>
            <DetailPageHeader
                title=" Add New Manufacturer"
            />
            <Container>
                <ManufacturerForm />
            </Container>
        </div>
    );
}
