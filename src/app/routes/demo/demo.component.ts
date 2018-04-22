// tslint:disable:quotemark
import { Component } from '@angular/core';
import { SFSchema, SFSchemaEnum, CascaderWidget, SFUISchema, FormProperty, PropertyGroup } from '@delon/form';
import { NzMessageService, CascaderOption, MentionOnSearchTypes } from 'ng-zorro-antd';
import { of } from 'rxjs/observable/of';
import { delay, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { _HttpClient } from '@delon/theme';

@Component({
    selector: 'app-demo',
    template: `
    layout="inline"
    layout="vertical"
    <br>
    <sf firstVisual
        [schema]="schema"
        [ui]="uiSchema"
        [formData]="formData"
        (formSubmit)="submit($event)"
        (formChange)="change($event)"
        (formError)="error($event)">
    </sf>
    `
})
export class DemoComponent {
    formData: any = {
        id: 1
    };
    uiSchema: SFUISchema = {};
    schema: SFSchema = {
        properties: {
            // 单个多选框
            protocol: {
                "type": "boolean",
                "title": "同意本协议",
                "description": "《用户协议》",
                "ui": {
                    "widget": "checkbox"
                },
                "default": true,
                allOf: [
                    {
                        type: 'boolean',
                        enum: [ true ]
                    }
                ]
            },
            // 多选框组
            "food1": {
                "type": "string",
                "title": "Food",
                "enum": [ "Apple", "Pear", "Orange" ],
                "ui": {
                    "widget": "checkbox",
                    "grid": { "span": 8 } // 指定每一项 8 个单元的布局
                },
                "default": ["Apple"]
            },
            // 异步数据
            "food2": {
                "type": "string",
                "title": "Food",
                "ui": {
                    "widget": "checkbox",
                    "asyncData": () => of([
                        { label: 'Apple', value: 'Apple' },
                        { label: 'Pear', value: 'Pear' },
                        { label: 'Orange', value: 'Orange' }
                    ]).pipe(delay(200))
                },
                "default": ["Apple"]
            },
        },
        required: [ 'protocol' ],
        ui: {
            // 指定 `label` 和 `control` 在一行中各占栅格数
            span_label: 4,
            span_control: 20
        }
    };

    constructor(private msg: NzMessageService, private http: _HttpClient) {
    }

    submit(value: any) {
        this.msg.success(JSON.stringify(value));
    }

    change(value: any) {
        // console.log('change', value);
    }

    error(value: any) {
        // console.log('error', value);
    }

}
