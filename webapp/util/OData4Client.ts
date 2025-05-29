import Filter from "sap/ui/model/Filter";
import IODataClient, { ODataAction } from "./IODataClient";
import ODataModel from "sap/ui/model/odata/ODataModel";
import ODataModelV4, {
	ODataModel$DataReceivedEvent,
} from "sap/ui/model/odata/v4/ODataModel";
import {
	MetadataAction,
	MetadataEntity,
	MetadataFunction,
	MetadataFunctionMethod,
} from "../Types";
import ODataHelper from "./ODataHelper";
import MessageBox from "sap/m/MessageBox";
import Sorter from "sap/ui/model/Sorter";

/**
 * @namespace de.kernich.odpu.util
 */
export default class OData4Client implements IODataClient {
	private model: ODataModelV4;
	private serviceUrl: string;
	private metadataText: string;
	private metadataXml: XMLDocument;
	constructor(serviceUrl: string) {
		let escapedServiceUrl = serviceUrl;
		if (!escapedServiceUrl.endsWith("/")) {
			escapedServiceUrl += "/";
		}
		this.serviceUrl = escapedServiceUrl;
		this.model = new ODataModelV4({
			serviceUrl: escapedServiceUrl,
			synchronizationMode: "None",
			earlyRequests: true,
			httpHeaders: {},
		});

		this.model.attachDataReceived({}, (event: ODataModel$DataReceivedEvent) => {
			const parameters = event.getParameters() as unknown as {
				error?: {
					error: {
						code: string;
						message: string;
					};
					message: string;
					status: number;
					requestUrl: string;
				};
				data?: object;
			};
			if (parameters.error?.status >= 400) {
				const message =
					"Requested failed: " +
					parameters.error.requestUrl +
					"\n\nMessage: " +
					parameters.error.message;
				MessageBox.error(message);
			}
		});
	}
	getActions(): MetadataAction[] {
		const actions: MetadataAction[] = [];

		const actionNodes = Array.from(
			this.metadataXml.getElementsByTagName("Action")
		).map((node) => ({
			Name: node.getAttribute("Name"),
			IsBound: node.getAttribute("IsBound"),
			Parameters: Array.from(node.getElementsByTagName("Parameter")).map(
				(paramNode) => ({
					Name: paramNode.getAttribute("Name"),
					Type: paramNode.getAttribute("Type"),
					Nullable: paramNode.getAttribute("Nullable"),
				})
			),
		}));

		for (const action of actionNodes) {
			actions.push({
				name: action.Name,
				isBound: action.IsBound === "true",
				parameters: action.Parameters.map((param) => ({
					name: param.Name,
					type: param.Type,
					nullable: param.Nullable === "true",
				})),
			});
		}

		return actions;
	}
	destroy(): void {}

	async createEntity(
		entityName: string,
		properties: Record<string, string | number | boolean>
	) {
		const binding = this.model.bindList(`/${entityName}`, undefined, [], [], {
			$$getKeepAliveContext: true,
		});

		const createdContext = binding.create(properties);

		await createdContext.created();
	}
	deleteEntity(
		entityName: string,
		keys: Record<string, string | number | boolean>
	) {
		const keyPath = Object.entries(keys)
			.map(([key, value]) => `${key}='${value}'`)
			.join(",");
		const entityBinding = this.model.getKeepAliveContext(
			`/${entityName}(${keyPath})`
		);

		return entityBinding.delete();
	}
	async getEntity(
		entityName: string,
		keys: Record<string, string | number | boolean>
	): Promise<object> {
		const keyPath = Object.entries(keys)
			.map(([key, value]) => `${key}='${value}'`)
			.join(",");
		const binding = this.model.bindContext(`/${entityName}(${keyPath})`);
		const obj = (await binding.requestObject()) as object;
		if (obj === undefined) {
			throw new Error("Entity not found");
		}
		return obj;
	}
	getEntities(): MetadataEntity[] {
		const entities: MetadataEntity[] = [];

		const entitySets = Array.from(
			this.metadataXml.getElementsByTagName("EntitySet")
		).map((node) => ({
			Name: node.getAttribute("Name"),
			EntityType: node.getAttribute("EntityType"),
		}));

		for (const entity of entitySets) {
			let entityType = entity.EntityType;
			if (entityType.includes(".")) {
				entityType = entityType.split(".").pop();
			}
			const entityTypeNode = Array.from(
				this.metadataXml.getElementsByTagName("EntityType")
			).find((node) => {
				return node.getAttribute("Name") === entityType;
			});
			const properties = Array.from(
				entityTypeNode.getElementsByTagName("Property")
			).map((propertyNode) => ({
				name: propertyNode.getAttribute("Name"),
				type: propertyNode.getAttribute("Type"),
				nullable: propertyNode.getAttribute("Nullable"),
				maxLength: ODataHelper.getMaxLength(
					propertyNode.getAttribute("MaxLength")
				),
			}));
			const keyNode = entityTypeNode.getElementsByTagName("Key")[0];

			const propertyRefs = Array.from(
				keyNode.getElementsByTagName("PropertyRef")
			).map((keyNode) => ({
				name: keyNode.getAttribute("Name"),
				type: properties.find(
					(property) => property.name === keyNode.getAttribute("Name")
				).type,
				nullable: properties.find(
					(property) => property.name === keyNode.getAttribute("Name")
				).nullable,
				maxLength: properties.find(
					(property) => property.name === keyNode.getAttribute("Name")
				).maxLength,
			}));

			entities.push({
				name: entity.Name,
				entityType: entityType,
				properties: properties,
				keys: propertyRefs,
			});
		}
		return entities;
	}
	getFunctions(): MetadataFunction[] {
		const functionImports = Array.from(
			this.metadataXml.getElementsByTagName("FunctionImport")
		).map((node) => ({
			Name: node.getAttribute("Name"),
			ReturnType: node.getAttribute("ReturnType"),
			EntitySet: node.getAttribute("EntitySet"),
			HttpMethod: node.getAttribute("m:HttpMethod"),
		}));

		return functionImports.map((func) => {
			const parameters = Array.from(
				this.metadataXml.getElementsByTagName("Parameter")
			).map((paramNode) => ({
				name: paramNode.getAttribute("Name"),
				type: paramNode.getAttribute("Type"),
				nullable: paramNode.getAttribute("Nullable"),
				maxLength: ODataHelper.getMaxLength(
					paramNode.getAttribute("MaxLength")
				),
			}));

			return {
				name: func.Name,
				returnType: func.ReturnType,
				entitySet: func.EntitySet,
				parameters: parameters,
				method: func.HttpMethod as MetadataFunctionMethod,
			};
		});
	}
	async readEntity(options: {
		entityName: string;
		filters: Filter[];
		sorting: Sorter[];
		headers: Record<string, string>;
		top: number;
		skip: number;
	}): Promise<object> {
		const binding = this.model.bindList(
			"/" + options.entityName,
			undefined,
			[],
			[],
			{}
		);
		const contexts = await binding.requestContexts();
		return contexts.map((context) => context.getObject() as object);
	}
	getModel(): ODataModel {
		return this.model as unknown as ODataModel;
	}
	getMetadataText(): string {
		return this.metadataText;
	}
	getMetadataXml(): XMLDocument {
		return this.metadataXml;
	}
	async initAsync() {
		this.metadataText = await ODataHelper.getMetadataText(this.serviceUrl);
		this.metadataXml = ODataHelper.parseMetadataXml(this.metadataText);
	}

	executeFunction(options: {
		functionName: string,
		parameters: Record<string, string | number | boolean>,
		method: 'GET' | 'POST'
	}): Promise<unknown> {
		throw new Error("Not implemented");
	}

	executeAction(options: {
		actionName: string,
		parameters: Record<string, string | number | boolean>,
		method: 'GET' | 'POST'
	}): Promise<unknown> {
		throw new Error("Not implemented");
	}
}
