---
title: array
subtitle: 数组
type: Widgets
---

创建对象数组，只对 `schema.type="array"` 时有效。

## schema 属性

参数        | 说明                     | 类型       | 默认值
------------|--------------------------|------------|--------
items       | 数组元素类型描述         | `SFSchema` | -
minItems    | 约束数组最小的元素个数   | `number`   | -
maxItems    | 约束数组最大的元素个数   | `number`   | -
uniqueItems | 约束数组每个元素都不相同 | `boolean`  | -

## ui 属性

参数         | 说明                       | 类型      | 默认值
-------------|----------------------------|-----------|----------
add_title    | 添加按钮文本               | `string`  | `添加`
add_type     | 添加按钮类型，等同 `nzType` | `string`  | `dashed`
removable    | 是否包含移除按钮           | `boolean` | `true`
remove_title | 移除按钮文本               | `string`  | `移除`

## Demo

```ts
schema = {
    properties: {
        product: {
            type: 'array',
            title: '产品清单',
            maxItems: 5,
            items: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        title: '名称'
                    },
                    price: {
                        type: 'number',
                        title: '单价',
                        minimum: 1
                    }
                },
                required: [ 'name', 'price' ]
            }
        }
    }
}
```
