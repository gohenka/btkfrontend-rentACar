import { CreatePaymentModel } from './../../models/createPaymentModel';
import { CardService } from './../../services/card.service';
import { ResponseModel } from './../../models/responseModel';
import { PaymentService } from './../../services/payment.service';
import { TotalPriceRequestModel } from './../../models/totalPriceRequestModel';
import { SingleResponseModel } from './../../models/singleResponseModel';
import { AdditionalServiceService } from './../../services/additional-service.service';
import { CreateAdditionalServiceModel } from './../../models/createAdditionalServiceRequestModel';
import { AdditionalServiceItemListModel } from './../../models/additionalServiceItemListModel';
import { AdditionalServiceItemService } from './../../services/additional-service-item.service';
import { PromoCodeService } from './../../services/promo-code.service';
import { PromoCodeListModel } from './../../models/promoCodeListModel';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RentalService } from './../../services/rental.service';
import { RentalListModel } from './../../models/rentalListModel';
import { CarService } from './../../services/car.service';
import { IndividualCustomerModel } from './../../models/individualCustomerModel';
import { CarListModel } from './../../models/carListModel';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { CardListModel } from 'src/app/models/cardListModel';

@Component({
  selector: 'app-rental',
  templateUrl: './rental.component.html',
  styleUrls: ['./rental.component.css'],
})
export class RentalComponent implements OnInit {
  title = 'Rentals Detail List';
  car: CarListModel;
  cars: CarListModel[] = [];
  carId: number;
  additionalServiceItems: AdditionalServiceItemListModel[] = [];
  additionalServiceItemBasket: CreateAdditionalServiceModel[] = [];
  addLoading = false;
  activeRental: RentalListModel;
  returnDate: Date;
  totalPrice: number;
  isCardDetailSaved = false;
  paymentLoading = false;
  status: string = 'rental';
  promoCode: PromoCodeListModel;
  constructor(
    private promoCodeService: PromoCodeService,
    private carService: CarService,
    private rentalService: RentalService,
    private activatedRoute: ActivatedRoute,
    private toastrService: ToastrService,
    private additionalServiceService: AdditionalServiceService,
    private additionalServiceItemService: AdditionalServiceItemService,
    private paymentService: PaymentService,
    private cardService:CardService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      console.log(params['carId']);
      this.getCarById(params['carId']);
    });
    this.carId = parseInt(this.activatedRoute.snapshot.paramMap.get('carId'));
    this.getAdditionalServiceItems();
  }

  rentalAddForm = new FormGroup({
    rentDate: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(30),
    ]),
    returnDate: new FormControl('', [Validators.required]),
  });
  clearRentalAddForm() {
    this.rentalAddForm.patchValue({
      rentDate: '',
      returnDate: '',
    });
  }

  promoCodeForm = new FormGroup({
    code: new FormControl('', [Validators.maxLength(30)]),
  });

  additionalServiceAddForm = new FormGroup({
    additionalServiceitem: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(30),
    ]),
  });
//payment add form
paymentAddForm = new FormGroup({
  nameOnTheCard: new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(250),
  ]),
  cardNumber: new FormControl('', [
    Validators.required,
    Validators.minLength(16),
    Validators.maxLength(16),
    Validators.pattern(/^[0-9]\d*$/),
  ]),
  month: new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(2),
    Validators.pattern(/^[0-9]\d*$/),
  ]),
  year: new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(2),
    Validators.pattern(/^[0-9]\d*$/),
  ]),
  cvv: new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(3),
    Validators.pattern(/^[0-9]\d*$/),
  ]),
});
  addRental() {
    if (this.rentalAddForm.valid) {
      let rentalModel = Object.assign({}, this.rentalAddForm.value);

      rentalModel.customerId = 1;
      if (this.promoCode == null) {
        rentalModel.promoCodeId = 2;
      }
      else
      {
        rentalModel.promoCodeId = this.promoCode.id;
      }
      
      rentalModel.carId = this.carId;
      console.log(rentalModel);
      this.rentalService.addRentalforindividiualcustomer(rentalModel)
        .subscribe((response) => {
          if (response.success) {
          this.returnDate = this.rentalAddForm.get('returnDate').value;
          this.addLoading = false;
          this.getRentalCarById(this.carId);
          this.status = 'service';   
          console.log(rentalModel)
             } 
        else 
        {
          this.toastrService.warning(response.message, 'Başarısız');
          this.addLoading = false;
        }
        });
    }
  }

  getPromoCodeByCode(code: string) {
    
    this.promoCodeService.getByCode(code).subscribe((response) => {
      if (response.success) {
        console.log(response.data);
        this.promoCode = response.data;
        this.toastrService.success(response.message, 'Başarılı');
      }
    });
  }

  getCarById(carId: number) {
    this.carService.getCarsById(carId).subscribe((response) => {
      this.car = response.data;

      //console.log(this.car)
    });
  }


  getRentalCarById(carId: number) {
    this.rentalService.getRentalCarById(carId).subscribe((response) => {
      this.activeRental = response.data;

      console.log(this.activeRental)
    });
  }

  getAdditionalServiceItems() {
    this.additionalServiceItemService.getAll().subscribe((response) => {
      if (response.success) {
      this.additionalServiceItems = response.data;

      console.log(this.additionalServiceItems);
    } else {
      this.toastrService.warning(response.message, 'Başarısız');
    }
    });
  }
  addAdditionalServices() {
    if (this.additionalServiceItemBasket.length < 1) {
      this.status = 'payment';
      this.calculateTotalPrice();
      return;
    }
    this.additionalServiceService
      .add(this.additionalServiceItemBasket)
      .subscribe(
        (response) => {
          if (response.success) {
            this.status = 'payment';
            this.calculateTotalPrice();
   //         this.toastrService.success(response.message, 'Başarılı');
          } else {
            this.toastrService.warning(response.message, 'Başarısız');
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.toastrService.error(errorResponse.message, 'Başarısız');
        }
      );
  }

  getRentalById(id: number) {
    this.rentalService
      .getRentalById(id)
      .subscribe((response: SingleResponseModel<RentalListModel>) => {
        this.activeRental = response.data;
        // this.toastrService.success(response.message,"Başarılı");
      });
  }

  addAdditionalServiceItem(id: number) {
    const model: CreateAdditionalServiceModel = {
      rentalId: this.activeRental.id,
      additionalServiceItemId: id,
    };
    this.toastrService.success('Eklendi', 'Başarılı');
    this.additionalServiceItemBasket.push(model);
  }
  removeAdditionalServiceItem(id: number) {
    this.additionalServiceItemBasket = this.additionalServiceItemBasket.filter(
      (model) => model.additionalServiceItemId !== id
    );
    this.toastrService.error('Çıkarıldı', 'Başarılı');
  }

  isBasketContainItem(id: number): boolean {
    if (
      this.additionalServiceItemBasket.filter(
        (e) => e.additionalServiceItemId === id
      ).length > 0
    ) {
      return true;
    } else return false;
  }
  calculateTotalPrice() {
    const model: TotalPriceRequestModel = {
      rentalId: this.activeRental.id,
      returnDate: this.rentalAddForm.get('returnDate').value,
    };

    this.paymentService.calculateTotalPrice(model).subscribe(
      (response) => {
        if (response.success) {
          this.toastrService.success('Toplam Ücret: ' + response.data, 'Başarılı');
          this.totalPrice = response.data;
        } else {
          this.toastrService.warning(response.message, 'Başarısız');
        }
      },
      (errorResponse: HttpErrorResponse) => {
        this.toastrService.error(errorResponse.message, 'Başarısız');
      }
    );
  }
 //sends payment request
 addPayment() {
  this.paymentLoading = true;
  let createPaymentModel: CreatePaymentModel = Object.assign(
    {},
    this.paymentAddForm.value
  );
  createPaymentModel.rentalId = this.activeRental.id;
  createPaymentModel.returnDate = this.returnDate;
  this.paymentService.addPayment(createPaymentModel).subscribe(
    (response: ResponseModel) => {
      if (response.success) {
        this.paymentLoading = false;
        this.status = 'success';
    //    this.toastrService.success(response.message, 'Başarılı');
      } else {
        this.toastrService.warning(response.message, 'Başarısız');
        this.paymentLoading = false;
      }
    },
    (errorResponse: HttpErrorResponse) => {
      this.toastrService.error(errorResponse.message, 'Başarısız');
      this.paymentLoading = false;
    }
  );
  this.paymentLoading = false;
}

addCustomerCardDetail() {
  let createCustomerCardDetailModel: CardListModel =
    Object.assign({}, this.paymentAddForm.value);
  createCustomerCardDetailModel.customerId = 1;
  this.cardService.addCard(createCustomerCardDetailModel).subscribe(
    (response: ResponseModel) => {
      if (response.success) {
        this.isCardDetailSaved = true;

        this.toastrService.success(response.message, 'Başarılı');
      } else {
        this.toastrService.warning(response.message, 'Başarısız');
      }
    },
    (errorResponse: HttpErrorResponse) => {
      this.toastrService.error(errorResponse.message, 'Başarısız');
    }
  );
}
}
