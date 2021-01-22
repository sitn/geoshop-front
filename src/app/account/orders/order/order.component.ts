import {Component, ComponentFactoryResolver, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {IOrder, IOrderDowloadLink, IOrderSummary, Order} from '../../../_models/IOrder';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import {GeoHelper} from '../../../_helpers/geoHelper';
import {OrderItemViewComponent} from '../../../_components/order-item-view/order-item-view.component';
import {WidgetHostDirective} from '../../../_directives/widget-host.directive';
import {ApiOrderService} from '../../../_services/api-order.service';
import {IApiResponseError} from '../../../_models/IApi';
import {GeoshopUtils} from '../../../_helpers/GeoshopUtils';
import {MatSnackBar} from '@angular/material/snack-bar';
import {StoreService} from '../../../_services/store.service';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../../_components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'gs2-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  @Input() order: IOrderSummary;

  // Map
  @Input() minimap: Map;
  @Input() vectorSource: VectorSource;

  // Order items
  @ViewChild(WidgetHostDirective) orderItemTemplate: WidgetHostDirective;
  selectedOrder: Order;

  constructor(private cfr: ComponentFactoryResolver,
              private snackBar: MatSnackBar,
              private storeService: StoreService,
              private router: Router,
              private dialog: MatDialog,
              private apiOrderService: ApiOrderService) {
  }

  ngOnInit(): void {
  }

  downloadOrder(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.selectedOrder) {
      return;
    }

    this.apiOrderService.downloadOrder(this.selectedOrder.id).subscribe(link => {
      if (!link) {
        this.snackBar.open(
          'Aucun fichier disponible', 'Ok', {panelClass: 'notification-info'}
        );
        return;
      }

      if ((link as IApiResponseError).error) {
        this.snackBar.open(
          (link as IApiResponseError).message, 'Ok', {panelClass: 'notification-error'}
        );
        return;
      }

      if ((link as IOrderDowloadLink).detail) {
        this.snackBar.open(
          // @ts-ignore
          (link as IOrderDowloadLink).detail, 'Ok', {panelClass: 'notification-info'}
        );
        return;
      }

      const downloadLink = (link as IOrderDowloadLink).download_link;
      if (downloadLink) {
        const urlsParts = downloadLink.split('/');
        const filename = urlsParts.pop() || urlsParts.pop();
        GeoshopUtils.downloadData(downloadLink, filename || 'download.zip');
      }
    });
  }

  duplicateInCart() {
    if (this.selectedOrder) {
      const copy = GeoshopUtils.deepCopyOrder(this.selectedOrder.toJson);
      copy.id = -1;
      this.storeService.addOrderToStore(new Order(copy));
    }
  }

  pushBackToCart() {
    if (this.selectedOrder) {
      this.storeService.addOrderToStore(this.selectedOrder);
    }
  }

  confirmOrder() {
    let dialogRef: MatDialogRef<ConfirmDialogComponent> | null = this.dialog.open(ConfirmDialogComponent, {
      disableClose: false,
    });

    if (!dialogRef) {
      return;
    }

    dialogRef.componentInstance.noButtonTitle = 'Annuler';
    dialogRef.componentInstance.yesButtonTitle = 'Confirmer';
    dialogRef.componentInstance.confirmMessage = 'Etes-vous sûr de vouloir confimrer la commande ?';
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apiOrderService.confirmOrder(this.selectedOrder.id).subscribe(newOrder => {
          if (newOrder && (newOrder as IApiResponseError).error) {
            this.snackBar.open(
              (newOrder as IApiResponseError).message, 'Ok', {panelClass: 'notification-error'}
            );
          } else {
            if (newOrder) {
              this.storeService.addOrderToStore(new Order(newOrder as IOrder));
            }
            this.router.navigate(['/account/orders']);
          }
        });
      }
      dialogRef = null;
    });
  }

  displayMiniMap() {
    if (this.selectedOrder) {
      GeoHelper.displayMiniMap(this.selectedOrder, [this.minimap], [this.vectorSource], 0);
      return;
    }

    this.apiOrderService.getOrder(this.order.url).subscribe((loadedOrder) => {
      if (loadedOrder) {
        this.selectedOrder = new Order(loadedOrder);
        this.order.statusAsReadableIconText = this.selectedOrder.statusAsReadableIconText;
        this.generateOrderItemsElements(this.selectedOrder);
        GeoHelper.displayMiniMap(this.selectedOrder, [this.minimap], [this.vectorSource], 0);
      }
    });
  }

  private generateOrderItemsElements(order: Order) {
    const componentFac = this.cfr.resolveComponentFactory(OrderItemViewComponent);
    const component = this.orderItemTemplate.viewContainerRef.createComponent(componentFac);
    component.instance.dataSource = order.items;
    component.instance.order = order;
    component.changeDetectorRef.detectChanges();
  }
}
