import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Product } from '../product';
import { GenericValidator } from '../../shared/generic-validator';
import { NumberValidators } from '../../shared/number.validator';
import { Store, createFeatureSelector } from '@ngrx/store';
import { State, getShowProductCode, getCurrentProduct, getProducts, getError, getShowProductDescription, getShowProductFilter } from '../state';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../product.service';
import { ProductPageActions } from '../state/actions';


@Component({
  selector: 'pm-product-edit',
  templateUrl: './product-edit.component.html'
})
export class ProductEditComponent implements OnInit, OnChanges {
  pageTitle = 'Product Edit';
  @Input() errorMessage: string;
  @Input() selectedProduct: Product;
  @Output() create = new EventEmitter<Product>();
  @Output() update = new EventEmitter<Product>();
  @Output() delete = new EventEmitter<Product>();
  @Output() clearCurrent = new EventEmitter<void>();
  @Output() displayFilterChanged = new EventEmitter<void>();
  @Input()  displayFilter: boolean;
  @Input()  products: Product[];
  products$: Observable<Product[]>;
  displayCode$: Observable<boolean>;
  displayDescription$: Observable<boolean>;
  displayFilter$: Observable<boolean>;
  productsSize: number;
  selectedProduct$: Observable<Product>;
  errorMessage$: Observable<string>;
  product: Product;
  productForm: FormGroup;

  // Use with the generic validation message class
  displayMessage: { [key: string]: string } = {};
  private validationMessages: { [key: string]: { [key: string]: string } };
  private genericValidator: GenericValidator;


  constructor(private fb: FormBuilder, private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router, private store: Store<State>) {
    // Defines all of the validation messages for the form.
    // These could instead be retrieved from a file or database.
    this.products$ = this.store.select(getProducts);

    this.validationMessages = {
      productName: {
        required: 'Product name is required.',
        minlength: 'Product name must be at least three characters.',
        maxlength: 'Product name cannot exceed 50 characters.'
      },
      productCode: {
        required: 'Product code is required.'
      },
      starRating: {
        range: 'Rate the product between 1 (lowest) and 5 (highest).'
      }
    };

    this.products$ = this.store.select(getProducts);

    // Do NOT subscribe here because it uses an async pipe
    this.errorMessage$ = this.store.select(getError);
    this.store.dispatch(ProductPageActions.loadProducts());
    // Do NOT subscribe here because it uses an async pipe
    this.selectedProduct$ = this.store.select(getCurrentProduct);

    // Do NOT subscribe here because it uses an async pipe
    this.displayCode$ = this.store.select(getShowProductCode);
    this.displayDescription$ = this.store.select(getShowProductDescription);
    this.displayFilter$ = this.store.select(getShowProductFilter);
    
    // Define an instance of the validator for use with this form,
    // passing in this form's set of validation messages.
    this.genericValidator = new GenericValidator(this.validationMessages);


  }

  ngOnInit(): void {

  
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getProduct(id).subscribe(data => {
      this.product = data
      console.log(this.product)
    });

    
    // Define the form group
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      productCode: ['', Validators.required],
      starRating: ['', NumberValidators.range(1, 5)],
      description: ''
    });

    // Watch for value changes for validation
    this.productForm.valueChanges.subscribe(
      () => this.displayMessage = this.genericValidator.processMessages(this.productForm)
    );
  }





  ngOnChanges(changes: SimpleChanges): void {
    // patch form with value from the store
    if (changes.selectedProduct) {
      const product = changes.selectedProduct.currentValue as Product;
      this.displayProduct(product);
    }
  }

  // Also validate on blur
  // Helpful if the user tabs through required fields
  blur(): void {
    this.displayMessage = this.genericValidator.processMessages(this.productForm);
  }

  displayProduct(product: Product | null): void {
    if (product && this.productForm) {
      // Reset the form back to pristine
      this.productForm.reset();

      // Display the appropriate page title
      if (product.id === 0) {
        this.pageTitle = 'Add Product';
      } else {
        this.pageTitle = `Edit Product: ${product.productName}`;
      }

      // Update the data on the form
      this.productForm.patchValue({
        productName: product.productName,
        productCode: product.productCode,
        starRating: product.starRating,
        description: product.description
      });
    }
  }

  cancelEdit(): void {
    // Redisplay the currently selected product
    // replacing any edits made
    this.displayProduct(this.selectedProduct);
  }

  deleteProduct(): void {
    if (this.selectedProduct && this.selectedProduct.id) {
      if (confirm(`Really delete the product: ${this.selectedProduct.productName}?`)) {
        this.delete.emit(this.selectedProduct);
      }
    } else {
      // No need to delete, it was never saved
      this.clearCurrent.emit();
    }
  }

  saveProduct(): void {
    if (this.productForm.valid) {
      if (this.productForm.dirty) {
        // Copy over all of the original product properties
        // Then copy over the values from the form
        // This ensures values not on the form, such as the Id, are retained
        const product = { ...this.selectedProduct, ...this.productForm.value };

        if (product.id === 0) {
          this.create.emit(product);
        } else {
          this.update.emit(product);
        }
      }
    }
  }



  checkChanged(): void {
    this.store.dispatch(ProductPageActions.toggleProductCode());
  }


  checkChangedFilter(): void {
    this.store.dispatch(ProductPageActions.toggleProductFilter());

  }

  checkChangedDescription(): void {
    this.store.dispatch(ProductPageActions.toggleProductDescription());

  }

  newProduct(): void {
    this.store.dispatch(ProductPageActions.initializeCurrentProduct());
  }

  productSelected(product: Product): void {
    this.store.dispatch(ProductPageActions.setCurrentProduct({ currentProductId: product.id }));
  }



  clearProduct(): void {
    this.store.dispatch(ProductPageActions.clearCurrentProduct());
  }

  updateProduct(product: Product): void {
    this.store.dispatch(ProductPageActions.updateProduct({ product }));
  }
}