import { Component, OnInit } from '@angular/core';
import { ArrayLayoutWidget } from '../../widget';

@Component({
    selector: 'sf-array',
    template: `
    <nz-form-item>
        <nz-col *ngIf="schema.title" [nzSpan]="ui.span_label" class="ant-form-item-label">
            <label>
                {{ schema.title }}
                <span class="optional">
                    {{ ui.optional }}
                    <nz-tooltip *ngIf="ui.optional_help" [nzTitle]="ui.optional_help">
                        <i nz-tooltip class="anticon anticon-question-circle-o"></i>
                    </nz-tooltip>
                </span>
            </label>
            <div class="add">
                <button nz-button [nzType]="addType" [disabled]="addDisabled" (click)="addItem()" [innerHTML]="addTitle"></button>
            </div>
        </nz-col>
        <nz-col class="ant-form-item-control-wrapper" [nzSpan]="ui.span_control" [nzOffset]="ui.offset_control">
            <div class="ant-form-item-control" [class.has-error]="showError">

                <nz-row class="sf-array-container">
                    <ng-container *ngFor="let i of formProperty.properties; let idx=index">
                        <nz-col [nzSpan]="array_span" *ngIf="i.visible">
                            <nz-card>
                                <sf-item [formProperty]="i"></sf-item>
                                <span *ngIf="removeTitle" class="remove" (click)="removeItem(idx)" [attr.title]="removeTitle">
                                    <i class="anticon anticon-delete"></i>
                                </span>
                            </nz-card>
                        </nz-col>
                    </ng-container>
                </nz-row>

                <nz-form-extra *ngIf="schema.description" [innerHTML]="schema.description"></nz-form-extra>
                <nz-form-explain *ngIf="!ui.only_visual && showError">{{error}}</nz-form-explain>

            </div>
        </nz-col>
    </nz-form-item>
    `
})
export class ArrayWidget extends ArrayLayoutWidget implements OnInit {

    addTitle: string;
    addType: string;
    removeTitle: string;
    array_span = 8;

    get addDisabled() {
        return this.schema.maxItems && (this.formProperty.properties as any[]).length >= this.schema.maxItems;
    }

    ngOnInit(): void {
        if (this.ui.grid && this.ui.grid.array_span)
            this.array_span = this.ui.grid.array_span;

        this.addTitle = this.ui.add_title || '添加';
        this.addType = this.ui.add_type || 'dashed';
        this.removeTitle = this.ui.removable === false ? null : this.ui.remove_title || '移除';
    }

    addItem() {
        this.formProperty.add();
    }

    removeItem(index: number) {
        this.formProperty.remove(index);
    }

    trackByIndex(index: number, item: any) {
        return index;
    }
}
