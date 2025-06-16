import Filter from "sap/ui/model/Filter";
import IODataClient from "./IODataClient";
import ODataModel from "sap/ui/model/odata/ODataModel";
import ODataModelV2 from "sap/ui/model/odata/v2/ODataModel";
import {
	MetadataAction,
	MetadataEntity,
	MetadataFunction,
	MetadataFunctionMethod,
} from "../Types";
import ODataHelper from "./ODataHelper";
import Context from "sap/ui/model/odata/v2/Context";
import { Model$RequestFailedEvent } from "sap/ui/model/Model";
import MessageBox from "sap/m/MessageBox";
import Sorter from "sap/ui/model/Sorter";
import Util from "./Util";

/**
 * @namespace de.kernich.odpu.util
 */
export default class OData2Client implements IODataClient {
	private model: ODataModelV2;
	private serviceUrl: string;
	private metadataText: string;
	private metadataXml: XMLDocument;

	constructor(serviceUrl: string) {
		this.serviceUrl = serviceUrl;
		this.model = new ODataModelV2(serviceUrl, {});

		this.model.attachRequestFailed({}, (event: Model$RequestFailedEvent) => {
			const parameters = event.getParameters() as {
				response: {
					responseText: string;
				};
			};
			const responseText = parameters.response.responseText;

			if (responseText.startsWith("<?xml")) {
				// Handle XML response
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(responseText, "text/xml");
				const messageNode = xmlDoc.getElementsByTagName("message")[0];
				if (messageNode) {
					MessageBox.error(messageNode.textContent);
				} else {
					MessageBox.error("Unknown error occurred");
				}
			} else {
				// Handle JSON response
				const json = JSON.parse(responseText) as {
					error: {
						code: string;
						message: {
							lang: string;
							value: string;
						};
						innererror: {
							errordetails: {
								message: string;
								code: string;
								severity: "Error" | "Warning" | "Information";
							}[];
						};
					};
				};
				MessageBox.error(json.error.message.value);
			}
		});
	}
	getActions(): MetadataAction[] {
		return [];
	}

	destroy(): void {}

	async createEntity(
		options: {
			entityName: string;
			properties: Record<string, unknown>;
			headers: Record<string, string>;
		}
	): Promise<void> {
		this.model.setHeaders(options.headers);
		await new Promise<void>((resolve, reject) => {
			this.model.create(`/${options.entityName}`, options.properties, {
				success: () => resolve(),
				error: (error: Error) => reject(error),
			});
		});
	}
	async getEntity(
		options: {
			entityName: string;
			keys: Record<string, string | number | boolean>;
			headers: Record<string, string>;
		}
	): Promise<object> {
		this.model.setHeaders(options.headers);
		const path = this.model.createKey(`/${options.entityName}`, options.keys);
		const context = await new Promise<Context>((resolve, reject) => {
			this.model.createBindingContext(
				path,
				undefined,
				{},
				(data: Context) => {
					if (data) {
						resolve(data);
					} else {
						reject(new Error("Failed to create binding context"));
					}
				},
				true
			);
		});
		return context.getObject();
	}

	async deleteEntity(
		options: {
			entityName: string;
			keys: Record<string, string | number | boolean>;
			headers: Record<string, string>;
		}
	): Promise<void> {
		this.model.setHeaders(options.headers);
		const path = this.model.createKey(`/${options.entityName}`, options.keys);
		await new Promise<void>((resolve, reject) => {
			this.model.remove(path, {
				success: () => resolve(),
				error: (error: Error) => reject(error),
			});
		});
	}

	async initAsync() {
		try {
			await this.model.metadataLoaded(true);
		} catch (error) {
			MessageBox.error("Failed to load metadata of Service " + this.serviceUrl + ":\n\nPlease check Backend configuration and try again.", {
				details: Util.getErrorMessage(error)
			});
			throw error;
		}
		this.metadataText = await ODataHelper.getMetadataText(this.serviceUrl);
		this.metadataXml = ODataHelper.parseMetadataXml(this.metadataText);
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
		return entities.filter((entity) => !entity.name.startsWith("SAP__"));
	}
	getMetadataText(): string {
		return this.metadataText;
	}
	getMetadataXml(): XMLDocument {
		return this.metadataXml;
	}
	getFunctions(): MetadataFunction[] {
		const functionImports = Array.from(
			this.metadataXml.getElementsByTagName("FunctionImport")
		).map((node) => ({
			Name: node.getAttribute("Name"),
			ReturnType: node.getAttribute("ReturnType"),
			EntitySet: node.getAttribute("EntitySet"),
			HttpMethod: node.getAttribute("m:HttpMethod"),
			Parameters: Array.from(node.getElementsByTagName("Parameter")).map(
				(paramNode) => ({
					name: paramNode.getAttribute("Name"),
					type: paramNode.getAttribute("Type"),
					nullable: paramNode.getAttribute("Nullable"),
					maxLength: ODataHelper.getMaxLength(
						paramNode.getAttribute("MaxLength")
					),
				})
			),
		}));

		return functionImports.map((func) => ({
			name: func.Name,
			returnType: func.ReturnType,
			entitySet: func.EntitySet,
			parameters: func.Parameters,
			method: func.HttpMethod as MetadataFunctionMethod,
		}));
	}

	getModel(): ODataModel {
		return this.model as unknown as ODataModel;
	}

	async readEntity(options: {
		entityName: string;
		filters: Filter[];
		sorting: Sorter[];
		headers: Record<string, string>;
		top: number;
		skip: number;
	}) {
		this.model.setHeaders(options.headers);
		return await new Promise((resolve, reject) => {
			this.model.read(`/${options.entityName}`, {
				success: (data: object) => {
					resolve(data);
				},
				error: (error: Error) => {
					reject(error);
				},
				filters: options.filters.length > 0 ? options.filters : undefined,
				sorters: options.sorting.length > 0 ? options.sorting : undefined,
				urlParameters: {
					$top: options.top.toString(),
					$skip: options.skip.toString(),
				},
			});
		});
	}

	async executeFunction(options: {
		functionName: string;
		parameters: Record<string, string | number | boolean>;
		method: "GET" | "POST";
	}): Promise<unknown> {
		return await new Promise((resolve, reject) => {
			this.model.callFunction(`/${options.functionName}`, {
				urlParameters: options.parameters,
				method: options.method,
				success: (data: object) => resolve(data),
				error: (error: Error) => reject(error),
			});
		});
	}

	executeAction(options: {
		actionName: string;
		parameters: Record<string, string | number | boolean>;
	}): Promise<unknown> {
		throw new Error("Not implemented: " + JSON.stringify(options));
	}
}
