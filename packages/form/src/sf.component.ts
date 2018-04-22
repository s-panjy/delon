import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, Input, SimpleChange, Output, EventEmitter, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DelonFormConfig } from './config';
import { di, retrieveSchema, FORMATMAPS } from './utils';
import { TerminatorService } from './terminator.service';
import { SFSchema } from './schema/index';
import { SFUISchema, SFUISchemaItem, SFRenderSchema, SFUISchemaItemRun } from './schema/ui';
import { FormProperty } from './model/form.property';
import { FormPropertyFactory } from './model/form.property.factory';
import { SchemaValidatorFactory } from './validator.factory';
import { WidgetFactory } from './widget.factory';
import { SFButton } from './interface';
import { ErrorData } from './errors';

export function useFactory(schemaValidatorFactory: any, options: DelonFormConfig) {
    return new FormPropertyFactory(schemaValidatorFactory, options);
}

@Component({
    selector: 'sf, [sf]',
    template: `
    <form nz-form [nzLayout]="layout" (submit)="onSubmit($event)" [autocomplete]="autocomplete">
        <sf-item [formProperty]="rootProperty"></sf-item>
        <nz-form-item [ngClass]="_btn.render.class" [ngStyle]="_btn.render.style">
            <nz-col class="ant-form-item-control-wrapper"
                [nzSpan]="_btn.render.grid.span" [nzOffset]="_btn.render.grid.offset"
                [nzXs]="_btn.render.grid.xs" [nzSm]="_btn.render.grid.sm" [nzMd]="_btn.render.grid.md"
                [nzLg]="_btn.render.grid.lg" [nzXl]="_btn.render.grid.xl">
                <div class="ant-form-item-control">
                    <ng-container *ngIf="button">
                        <button type="submit" nz-button [nzType]="_btn.submit_type" [disabled]="liveValidate && !valid">{{_btn.submit}}</button>
                        <button *ngIf="_btn.reset" (click)="reset()" type="button" nz-button [nzType]="_btn.reset_type">{{_btn.reset}}</button>
                    </ng-container>
                    <ng-content></ng-content>
                </div>
            </nz-col>
        </nz-form-item>
    </form>`,
    styleUrls: ['./patch.less'],
    providers: [
        WidgetFactory,
        {
            provide: FormPropertyFactory,
            useFactory: useFactory,
            deps: [SchemaValidatorFactory, DelonFormConfig]
        },
        TerminatorService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SFComponent implements OnInit, OnChanges, OnDestroy {

    rootProperty: FormProperty = null;
    _formData: any;
    _btn: SFButton;
    private _item: any;
    private _valid = true;
    private _defUi: SFUISchemaItem;
    private inited = false;

    // region: fields

    /** 表单布局，等同 `nzLayout`，默认：horizontal */
    @Input() layout: 'horizontal' | 'vertical' | 'inline' = 'horizontal';

    /** JSON Schema */
    @Input() schema: SFSchema;

    /** UI Schema */
    @Input() ui: SFUISchema;

    /** 表单默认值 */
    @Input() formData: {};

    /**
     * 按钮
     * - 指定 `null` 或 `undefined` 表示手动添加按钮
     * - 使用固定 `label` 标签宽度时，若无 `render.class` 则默认为居中状态
     */
    @Input() button: SFButton = {};

    /**
     * 是否实时校验，默认：`true`
     * - `true` 每一次都校验
     * - `false` 提交时校验
     */
    @Input()
    get liveValidate() { return this._liveValidate; }
    set liveValidate(value: any) {
        this._liveValidate = coerceBooleanProperty(value);
    }
    private _liveValidate = true;

    /** 指定表单 `autocomplete` 值 */
    @Input() autocomplete: 'on' | 'off';

    /** 立即显示错误视觉 */
    @Input()
    get firstVisual() { return this._firstVisual; }
    set firstVisual(value: any) {
        this._firstVisual = coerceBooleanProperty(value);
    }
    private _firstVisual = true;

    /** 数据变更时回调 */
    @Output() formChange = new EventEmitter<{}>();

    /** 提交表单时回调 */
    @Output() formSubmit = new EventEmitter<{}>();

    /** 表单校验结果回调 */
    @Output() formError = new EventEmitter<ErrorData[]>();

    // endregion

    get valid(): boolean {
        return this._valid;
    }

    get item(): any {
        return this._item;
    }

    onSubmit(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.liveValidate) this.validator();
        if (!this.valid) return;
        this.formSubmit.emit(this.item);
    }

    constructor(
        private formPropertyFactory: FormPropertyFactory,
        private terminator: TerminatorService,
        private options: DelonFormConfig,
        private cd: ChangeDetectorRef
    ) {
        this.liveValidate = options.live_validate;
        this.firstVisual = options.first_visual;
        this.autocomplete = options.autocomplete;
    }

    private coverProperty() {
        const isHorizontal = this.layout === 'horizontal';
        const { definitions } = this.schema;

        const inFn = (schema: SFSchema, uiSchema: SFUISchemaItemRun, parentSchema: SFSchema, isArray: boolean) => {
            Object.keys(schema.properties).forEach(key => {
                const uiKey = `$${key}`;
                const property = retrieveSchema(schema.properties[key] as SFSchema, definitions);
                if (!property.ui) {
                    if (Array.isArray(property.enum) && property.enum.length > 0) {
                        property.ui = { widget: 'select' };
                    }
                } else if (typeof property.ui === 'string') {
                    property.ui = { widget: property.ui };
                }
                const ui = Object.assign(
                    { widget: property.type },
                    property.format && FORMATMAPS[property.format || ''],
                    property.type === 'string' && Array.isArray(property.enum) ? { widget: 'select' } : null,
                    this._defUi,
                    property.ui,
                    isArray && uiSchema[uiKey] == null ? uiSchema : uiSchema[uiKey]
                ) as SFUISchemaItemRun;
                const schemaUi = (typeof schema.ui === 'string' ? { widget: schema.ui } : schema.ui) || {};
                if (isHorizontal) {
                    if (schemaUi.span_label_fixed) {
                        if (!ui.span_label_fixed) ui.span_label_fixed = schemaUi.span_label_fixed;
                    } else {
                        if (!ui.span_label) ui.span_label = typeof schemaUi.span_label === 'undefined' ? 5 : schemaUi.span_label;
                        if (!ui.span_control) ui.span_control = typeof schemaUi.span_control === 'undefined' ? 19 : schemaUi.span_control;
                        if (!ui.offset_control) ui.offset_control = typeof schemaUi.offset_control === 'undefined' ? null : schemaUi.offset_control;
                    }
                } else {
                    ui.span_label = null;
                    ui.span_control = null;
                    ui.offset_control = null;
                }

                uiSchema[uiKey] = ui;
                delete property.ui;

                if (property.items) {
                    uiSchema[uiKey]['$items'] = uiSchema[uiKey]['$items'] || {};
                    inFn(property.items, uiSchema[uiKey]['$items'], property.items, true);
                }

                if (property.properties && Object.keys(property.properties).length) {
                    inFn(property, uiSchema[uiKey], schema, false);
                }
            });
        };

        if (this.ui == null) this.ui = {};
        this._defUi = Object.assign(<SFUISchemaItem>{
            only_visual: this.options.only_visual,
            size: this.options.size,
            live_validate: this.liveValidate,
            first_visual: this.firstVisual
        }, this.schema.ui, this.ui['*']);
        delete this.ui['*'];

        // root
        this.ui = Object.assign(this.ui, this._defUi);

        inFn(this.schema, this.ui, this.schema, false);

        if (this.ui.debug) di('cover schema & ui', this.ui, this.schema);
    }

    private coverButtonProperty() {
        this._btn = Object.assign({ render: {} }, this.options.button, this.button);
        const firstKey = Object.keys(this.ui).find(w => w.startsWith('$'));
        if (this.layout === 'horizontal') {
            const btnUi = firstKey ? this.ui[firstKey] : this._defUi;
            if (!this._btn.render.grid) {
                this._btn.render.grid = {
                    offset: btnUi.span_label,
                    span: btnUi.span_control
                };
            }
            // 固定标签宽度时，若不指定样式，则默认居中
            if (!this._btn.render.class && (typeof btnUi.span_label_fixed === 'number' && btnUi.span_label_fixed > 0)) {
                this._btn.render.class = 'text-center';
            }
        } else {
            this._btn.render.grid = {};
        }

        if (this.ui.debug) di('button property', this._btn);
    }

    ngOnInit(): void {
        this.inited = true;
        this.validator();
    }

    ngOnChanges(changes: { [P in keyof this]?: SimpleChange } & SimpleChanges): void {
        this.refreshSchema();
    }

    /** @internal */
    _addTpl(path: string, templateRef: TemplateRef<{}>) {
        const property = this.rootProperty.searchProperty(path);
        if (!property) {
            console.warn(`未找到路径 ${path}`);
            return ;
        }
        (property.ui as SFUISchemaItemRun)._render = templateRef;
    }

    private validator() {
        this.rootProperty._runValidation();
        const errors = this.rootProperty.errors;
        this._valid = !(errors && errors.length);
        this.formError.emit(errors);
        this.cd.detectChanges();
    }

    /**
     * 刷新 Schema，一般需要动态修改 Schema 某个值时可以方便调用
     */
    refreshSchema(newSchema?: SFSchema) {

        if (newSchema) this.schema = newSchema;
        if (!this.schema) throw new Error(`Invalid Schema`);
        if (this.schema.ui && typeof this.schema.ui === 'string') throw new Error(`Don't support string with root ui property`);

        this.schema.type = 'object';
        if (!this.schema.properties) this.schema.properties = {};

        this._formData = { ...this.formData };

        if (this.inited) this.terminator.destroy();

        this.coverProperty();
        this.coverButtonProperty();

        if (this.ui.debug) {
            di('schema', this.schema);
        }

        this.rootProperty = this.formPropertyFactory.createProperty(this.schema, this.ui, this.formData);

        this.rootProperty.valueChanges.subscribe(value => {
            this._item = Object.assign({}, this.formData, value);
            this.formChange.emit(this._item);
        });
        this.rootProperty.errorsChanges.subscribe(errors => {
            this._valid = !(errors && errors.length);
            this.formError.emit(errors);
            this.cd.detectChanges();
            console.log('sf-error', errors);
        });

        this.reset();
    }

    /** 重置表单 */
    reset() {
        this.rootProperty.resetValue(this.formData, false);
        Promise.resolve().then(() => this.cd.detectChanges());
    }

    ngOnDestroy(): void {
        this.terminator.destroy();
    }
}
