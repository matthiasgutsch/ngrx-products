import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';

import { Product } from '../product';

/* NgRx */
import { Store, createFeatureSelector } from '@ngrx/store';
import { State, getShowProductCode, getCurrentProduct, getProducts, getError, getShowProductDescription, getShowProductFilter } from '../state';

import { ProductPageActions } from '../state/actions';
import { ProductState } from '../state/product.reducer';
import { ProductService } from '../product.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  displayCode$: Observable<boolean>;
  displayDescription$: Observable<boolean>;
  displayFilter$: Observable<boolean>;
  productsSize: number;
  selectedProduct$: Observable<Product>;
  products$: Observable<Product[]>;
  errorMessage$: Observable<string>;
  product: Product;
  @Output() displayFilterChanged = new EventEmitter<void>();

  constructor(private store: Store<State>,
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router,) { }

  ngOnInit() {

    // Do NOT subscribe here because it uses an async pipe
    // This gets the initial values until the load is complete.
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

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getProduct(id).subscribe(data => {
      this.product = data
      console.log(this.product)
    });

  }


  checkChanged(): void {
    this.store.dispatch(ProductPageActions.toggleProductCode());
  }




  checkChangedDescription(): void {
    this.store.dispatch(ProductPageActions.toggleProductDescription());

  }

  checkChangedFilter(): void {
    this.displayFilterChanged.emit();
  }



  newProduct(): void {
    this.store.dispatch(ProductPageActions.initializeCurrentProduct());
  }

  productSelected(product: Product): void {
    this.store.dispatch(ProductPageActions.setCurrentProduct({ currentProductId: product.id }));
  }

  deleteProduct(product: Product): void {
    this.store.dispatch(ProductPageActions.deleteProduct({ productId: product.id }));
  }

  clearProduct(): void {
    this.store.dispatch(ProductPageActions.clearCurrentProduct());
  }
  saveProduct(product: Product): void {
    this.store.dispatch(ProductPageActions.createProduct({ product }));
  }

  updateProduct(product: Product): void {
    this.store.dispatch(ProductPageActions.updateProduct({ product }));
  }
}
