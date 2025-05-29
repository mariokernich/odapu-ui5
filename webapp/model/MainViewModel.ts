export interface MainViewModel {
	selectedService: {
		service: {
			ServiceName: string;
			ODataType: "2" | "4";
			ServicePath: string;
			Version: string;
		};
	};
	selectedEntityName: string;
	selectedFunctionName: string;
	selectedActionName: string;
	selectedMethod: string;
	resourceType: string;
	top?: number;
	skip?: number;
} 