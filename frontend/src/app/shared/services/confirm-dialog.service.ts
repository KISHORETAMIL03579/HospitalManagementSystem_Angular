import {
  Injectable,
  ApplicationRef,
  EnvironmentInjector,
  createComponent,
  ComponentRef,
  inject,
} from "@angular/core";
import {
  ConfirmDialogComponent,
  ConfirmDialogOptions,
} from "@shared/components/confirm-dialog/confirm-dialog.component";

@Injectable({
  providedIn: "root",
})
export class ConfirmDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Create component dynamically using Angular's EnvironmentInjector
      const componentRef: ComponentRef<ConfirmDialogComponent> =
        createComponent(ConfirmDialogComponent, {
          environmentInjector: this.injector,
        });

      // Bind input properties
      componentRef.instance.title = options.title;
      componentRef.instance.message = options.message;
      if (options.confirmText)
        componentRef.instance.confirmText = options.confirmText;
      if (options.cancelText)
        componentRef.instance.cancelText = options.cancelText;
      if (options.variant) componentRef.instance.variant = options.variant;
      if (options.iconName) componentRef.instance.iconName = options.iconName;

      // Attach to Angular's application view tree
      this.appRef.attachView(componentRef.hostView);

      // Append DOM element to body
      const domElem = (componentRef.hostView as any)
        .rootNodes[0] as HTMLElement;
      document.body.appendChild(domElem);

      const cleanup = () => {
        this.appRef.detachView(componentRef.hostView);
        if (domElem && domElem.parentNode) {
          domElem.parentNode.removeChild(domElem);
        }
        componentRef.destroy();
      };

      // Subscribe to outputs
      componentRef.instance.confirmed.subscribe(() => {
        cleanup();
        resolve(true);
      });

      componentRef.instance.cancelled.subscribe(() => {
        cleanup();
        resolve(false);
      });
    });
  }
}
