import FilterOperator from "sap/ui/model/FilterOperator";

export type ServiceEntity = {
	ServiceName: string;
	ODataType: "2" | "4";
	ServicePath: string;
	Version: string;
	IsFavorite: boolean;
};

export type PushChannelEntity = {
	ApplicationId: string;
	Version: string;
	Path: string;
	ClassName: string;
	ProtocolTypeId: string;
	AmcMessageTypeId: string;
};

export type InfoEntity = {
	Version: string;
	RemoteVersion: string;
	UpdateAvailable: boolean;
	LatestReleaseBody: string;
}

export type MetadataEntity = {
	name: string;
	entityType: string;
	properties: MetadataEntityProperty[];
	keys: MetadataEntityProperty[];
	navigationProperties: MetadataNavigationProperty[];
};

export type MetadataNavigationProperty = {
	name: string;
	relationship: string;
	fromRole: string;
	toRole: string;
}

export type MetadataAssociation = {
	name: string;
	end: MetadataAssociationEnd[];
	referentialConstraint?: ReferentialConstraint
}

export type MetadataAssociationEnd = {
	type: string;
	multiplicity: string;
	role: string;
	onDeleteAction?: string;
}

export type ReferentialConstraint = {
	principal: {
		role: string;
		propertyRef: {
			name: string;
		}[];
	}[];
	dependent: {
		role: string;
		propertyRef: {
			name: string;
		}[];
	};
}

export type MetadataFunction = {
	name: string;
	returnType: string;
	entitySet: string;
	parameters: MetadataEntityProperty[];
	method: MetadataFunctionMethod;
};

export type MetadataAction = {
	name: string;
	isBound: boolean;
	parameters: {
		name: string;
		type: string;
		nullable: boolean;
	}[];
	returnType?: string;
	entitySetPath?: string;
};

export type MetadataComplexType = {
	name: string;
	properties: MetadataEntityProperty[];
};

export type MetadataFunctionMethod = "GET" | "POST";

export type MetadataEntityProperty = {
	name: string;
	type: string;
	nullable: string;
	maxLength: number;
};

export type RequestHeader = {
	key: string;
	value: string;
};

export type MainViewModel = {
	resourceType: string;
	selectedEntityName: string;
	selectedFunctionName: string;
	response: string;
	selectedMethod: string;
	selectedActionName: string;
	selectedServiceFunctions: MetadataFunction[];
	selectedServiceActions: MetadataAction[];
	selectedEntityProperties: {
		properties: MetadataEntityProperty[];
		keyProperties: MetadataEntityProperty[];
		navigationProperties: MetadataNavigationProperty[];
	};
	selectedNavigationProperties: string[];
	entityCount: number;
	functionCount: number;
	actionCount: number;
	top: number;
	skip: number;
	dark: boolean;
	statusCode: number;
	view: string;
	folderTreeIcon: string;
	dataViewMode: "json" | "table";
};

export type SelectedFunctionModel = {
	name: string;
	returnType: string;
	entitySet: string;
	parameters: MetadataEntityProperty[];
	method: "GET" | "POST";
};

export type SelectedServiceModel = {
	service: ServiceEntity | null;
	entities: MetadataEntity[] | null;
	actions: MetadataAction[] | null;
};

export type RequestHistory = {
	method: string;
	entity: string;
	timestamp: string;
	statusCode: number;
	response: string;
};

export type FilterRecord = {
	property: string;
	operator: FilterOperator;
	value: string;
};

export type Project = {
	ProjectName: string;
	Odatatype: string;
	ServiceName: string;
	ServicePath: string;
	ServiceVersion: string;
	EntityMethod?: string;
	EntityName?: string;
	FunctionName?: string;
	ActionName?: string;
	RequestType?: string;
	Top?: number;
	Skip?: number;
	Headers: string;
	Filters: string;
	Sorters: string;
}