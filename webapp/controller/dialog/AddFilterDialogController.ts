import DialogController from "../../util/DialogController";
import FilterOperator from "sap/ui/model/FilterOperator";

/**
 * @namespace de.kernich.odpu.controller.dialog
 */
export default class AddFilterDialogController extends DialogController {
    public data = {
        properties: [] as { key: string; text: string }[],
        operators: [
            { key: FilterOperator.Contains, text: "Contains" },
            { key: FilterOperator.NotContains, text: "Does Not Contain" },
            { key: FilterOperator.StartsWith, text: "Starts With" },
            { key: FilterOperator.EndsWith, text: "Ends With" },
            { key: FilterOperator.NotStartsWith, text: "Does Not Start With" },
            { key: FilterOperator.NotEndsWith, text: "Does Not End With" },
            { key: FilterOperator.EQ, text: "Equal" },
            { key: FilterOperator.NE, text: "Not Equal" },
            { key: FilterOperator.GT, text: "Greater Than" },
            { key: FilterOperator.LT, text: "Less Than" },
            { key: FilterOperator.GE, text: "Greater Than or Equal" },
            { key: FilterOperator.LE, text: "Less Than or Equal" }
        ],
        selectedProperty: "",
        selectedOperator: FilterOperator.Contains,
        selectedValue: ""
    };
} 