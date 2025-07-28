// import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common'
// @Injectable()
// export class TransformPayloadPipe implements PipeTransform {
//     transform(value: any, metadata: ArgumentMetadata): any {
//         const targetType = metadata.metatype
//         const object = new targetType()
//         for (const key in value) {
//             const propertyType = Reflect.getMetadata(
//                 'design:type',
//                 targetType.prototype,
//                 key
//             )
//             const transformedValue = this.transformValue(
//                 value[key],
//                 propertyType
//             )
//             object[key] = transformedValue
//         }
//         return object
//     }

//     // eslint-disable-next-line @typescript-eslint/ban-types
//     private transformValue(value: any, type: Function) {
//         if (type === String) {
//             return String(value)
//         } else if (type === Boolean) {
//             if (value === 'true') {
//                 return (value = true)
//             } else if (value === 'false') {
//                 return (value = false)
//             }
//         } else if (type === Number) {
//             return Number(value)
//         } else if (type === Date) {
//             return new Date(value)
//         } else if (type === Array) {
//             return Array.isArray(value) ? value : [value]
//         } else {
//             if (!type) return ''
//             return type === Object ? value : JSON.parse(value)
//         }
//     }
// }
