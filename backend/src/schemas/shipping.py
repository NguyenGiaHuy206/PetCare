from pydantic import BaseModel, Field


class ShippingQuoteRequest(BaseModel):
    to_district_id: int = Field(gt=0)
    to_ward_code: str = Field(min_length=1)


class ShippingQuoteResponse(BaseModel):
    carrier: str = "GHN"
    service_fee: float
    total_weight_gram: int
    length_cm: int
    width_cm: int
    height_cm: int
