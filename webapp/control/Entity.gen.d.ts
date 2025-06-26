import EntityKey from "de/kernich/odpu/control/EntityKey";
import EntityProperty from "de/kernich/odpu/control/EntityProperty";
import EntityNavigationProperty from "de/kernich/odpu/control/EntityNavigationProperty";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { AggregationBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./Entity" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EntitySettings extends $ControlSettings {
        prefix?: string | PropertyBindingInfo;
        title?: string | PropertyBindingInfo;
        keys?: EntityKey[] | EntityKey | AggregationBindingInfo | `{${string}}`;
        properties?: EntityProperty[] | EntityProperty | AggregationBindingInfo | `{${string}}`;
        navigationProperties?: EntityNavigationProperty[] | EntityNavigationProperty | AggregationBindingInfo | `{${string}}`;
    }

    export default interface Entity {

        // property: prefix
        getPrefix(): string;
        setPrefix(prefix: string): this;

        // property: title
        getTitle(): string;
        setTitle(title: string): this;

        // aggregation: keys
        getKeys(): EntityKey[];
        addKey(keys: EntityKey): this;
        insertKey(keys: EntityKey, index: number): this;
        removeKey(keys: number | string | EntityKey): EntityKey | null;
        removeAllKeys(): EntityKey[];
        indexOfKey(keys: EntityKey): number;
        destroyKeys(): this;

        // aggregation: properties
        getProperties(): EntityProperty[];
        addProperty(properties: EntityProperty): this;
        insertProperty(properties: EntityProperty, index: number): this;
        removeProperty(properties: number | string | EntityProperty): EntityProperty | null;
        removeAllProperties(): EntityProperty[];
        indexOfProperty(properties: EntityProperty): number;
        destroyProperties(): this;

        // aggregation: navigationProperties
        getNavigationProperties(): EntityNavigationProperty[];
        addNavigationProperty(navigationProperties: EntityNavigationProperty): this;
        insertNavigationProperty(navigationProperties: EntityNavigationProperty, index: number): this;
        removeNavigationProperty(navigationProperties: number | string | EntityNavigationProperty): EntityNavigationProperty | null;
        removeAllNavigationProperties(): EntityNavigationProperty[];
        indexOfNavigationProperty(navigationProperties: EntityNavigationProperty): number;
        destroyNavigationProperties(): this;
    }
}
