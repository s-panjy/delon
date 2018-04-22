---
order: 3
title: 自定义小部件
type: Documents
---

## 写在前面

`@delon/form` 尽可能满足不同需求，除现有内置的十几种基础组件小部件外，可以通过以下两种方式进一步扩展需求：

## 一、利用 `custom` 小部件进行扩展

细节请参考 [custom-自定义]()。

## 二、完全自定义

当 `custom` 小部件无法满足你的扩展时，可以使用更宽松的扩展方式。

### 1、编写小部件

**常见小部件库**

默认情况下 @delon/form 实现了一些常见需求，但需要额外类库支持的，称它为第三方组件小部件，这一部分小部件存在于[widgets-third](https://github.com/cipchk/@delon/form/tree/master/widgets-third)目录里；你可以直接复制使用。

这些组件包括：

| 名称 | 描述 | 描述 |
| --- | ---- | ---- |
| `tinymce` | Tinymce 富文本框 | [文档](https://github.com/cipchk/@delon/form/blob/master/widgets-third/tinymce/index.md) |
| `ueditor` | UEditor 富文本框 | [文档](https://github.com/cipchk/@delon/form/blob/master/widgets-third/ueditor/index.md) |

**自己创建小部件**

小部件就是一个组件，你只需要继承 `ControlWidget` 就相当于构建一个小部件，其结构如下：

```ts
import { Component, OnInit } from '@angular/core';
import { ControlWidget } from '@delon/form';

@Component({
    selector: 'nz-sf-ueditor-widget',
    template: `
    <!-- 表单 `label` 区域，建议保持以下原样代码，以确保响应式的支持 -->
    <nz-form-label *ngIf="schema.title" [nzSpan]="ui.span_label" [nzRequired]="ui._required" [nzFor]="id">
        {{ schema.title }}
        <span class="optional">
            {{ ui.optional }}
            <nz-tooltip *ngIf="ui.optional_help" [nzTitle]="ui.optional_help">
                <i nz-tooltip class="anticon anticon-question-circle-o"></i>
            </nz-tooltip>
        </span>
    </nz-form-label>
    <!-- 表单 `control` 区域，建议保持以下原样代码，以确保响应式的支持 -->
    <nz-col class="ant-form-item-control-wrapper" [nzSpan]="ui.span_control" [nzOffset]="ui.offset_control">
        <div class="ant-form-item-control" [class.has-error]="showError">

            <!-- 自定义控件区域 -->
            <ueditor
                [formControl]="control"
                [config]="config"
                [loadingTip]="loadingTip"
                (onContentChange)="change($event)"></ueditor>

            <!-- 异常处理，建议保持以下原样代码，以确保响应式的支持 -->
            <nz-form-extra *ngIf="schema.description" [innerHTML]="schema.description"></nz-form-extra>
            <nz-form-explain *ngIf="showError">{{error}}</nz-form-explain>
        </div>
    </nz-col>`
})
export class UEditorWidget extends ControlWidget implements OnInit {
    /* 用于注册小部件 KEY 值 */
    static readonly KEY = 'ueditor';

    /**
     * 组件所需要的参数，建议使用 `ngOnInit` 获取
     */
    config: any;
    loadingTip: string;

    ngOnInit(): void {
        this.loadingTip = this.widgetData.loadingTip || '加载中……';
        this.config = this.widgetData.config || {};
    }

    reset(value: any) {
        // reset 可以更好的解决表单重置过程中所需要的新数据问题
    }
}
```

### 2、注册小部件

在根模块中定义（`declarations`、`entryComponents`）注册小部件组件，同时在模块中导入 `WidgetRegistry` 并注册自定义小部件。

```ts
@NgModule({
    declarations: [ UEditorWidget ],
    entryComponents: [ UEditorWidget ],
    imports: [
        NzSchemaFormModule.forRoot({})
    ]
})
export class AppModule {
    constructor(widgetRegistry: WidgetRegistry) {
        widgetRegistry.register(UEditorWidget.KEY, UEditorWidget);
    }
}
```

当然为了更友好的维护，建议在Shared目录下定义一个专属 Json schema 模块，有兴趣可参考 [ng-alain实现](https://github.com/cipchk/ng-alain/blob/master/src/app/shared/json-schema/json-schema.module.ts)。

### 2、使用自定义小部件

同其他小部件一样，只需要指定 `widget` 值，例如：

```json
"intro": {
    "type": "string",
    "ui": {
        "widget": "ueditor"
    }
}
```
