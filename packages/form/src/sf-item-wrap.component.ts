import { Component, Input } from '@angular/core';
import { SFUISchemaItem, SFSchema } from '..';

@Component({
    selector: 'sf-item-wrap',
    template: `
    <nz-form-item>
        <nz-col *ngIf="showTitle" [nzSpan]="ui.span_label" class="ant-form-item-label">
            <label [attr.for]="id" [class.ant-form-item-required]="ui._required">
                {{ schema.title }}
                <span class="optional">
                    {{ ui.optional }}
                    <nz-tooltip *ngIf="ui.optional_help" [nzTitle]="ui.optional_help">
                        <i nz-tooltip class="anticon anticon-question-circle-o"></i>
                    </nz-tooltip>
                </span>
            </label>
        </nz-col>
        <nz-col class="ant-form-item-control-wrapper" [nzSpan]="ui.span_control" [nzOffset]="ui.offset_control">
            <div class="ant-form-item-control" [class.has-error]="showError">
                <ng-content></ng-content>
                <nz-form-extra *ngIf="schema.description" [innerHTML]="schema.description"></nz-form-extra>
                <nz-form-explain *ngIf="!ui.only_visual && showError">{{error}}</nz-form-explain>
            </div>
        </nz-col>
    </nz-form-item>`
})
export class SFItemWrapComponent {
    @Input() id: string;
    @Input() schema: SFSchema;
    @Input() ui: SFUISchemaItem;
    @Input() showError: boolean;
    @Input() error: string;
    @Input() showTitle: boolean;
}
