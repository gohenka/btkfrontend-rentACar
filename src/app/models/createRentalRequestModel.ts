export interface CreateRentalRequestModel{
    customerId:number;

	carId:number;

	pickUpCityId:number;

	returnCityId:number;

	promoCodeId:number;

	rentDate:number;

	returnDate:number;

	rentedKilometer:number;

	returnKilometer:number;
}