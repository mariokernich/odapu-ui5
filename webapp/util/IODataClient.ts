import Filter from "sap/ui/model/Filter";
import { MetadataAction, MetadataEntity, MetadataFunction } from "../Types";
import Sorter from "sap/ui/model/Sorter";

/**
 * @namespace de.kernich.odpu.util
 */
export interface ReadEntityOptions {
	entityName: string;
	filters: Filter[];
	sorting: Sorter[];
	headers: Record<string, string>;
	top: number;
	skip: number;
}

export default interface IODataClient {
	initAsync(): Promise<void>;
	getEntities(): MetadataEntity[];
	getFunctions(): MetadataFunction[];
	getActions(): MetadataAction[];
	readEntity(options: ReadEntityOptions): Promise<unknown>;
	getEntity(entityName: string, keys: Record<string, string>): Promise<unknown>;
	createEntity(entityName: string, properties: Record<string, unknown>): Promise<void>;
	deleteEntity(entityName: string, keys: Record<string, string>): Promise<void>;
	getMetadataText(): string;
	executeFunction(options: {
		functionName: string,
		parameters: Record<string, string | number | boolean>,
		method: 'GET' | 'POST'
	}): Promise<unknown>;
	executeAction(options: {
		actionName: string,
		parameters: Record<string, string | number | boolean>,
		method: 'GET' | 'POST'
	}): Promise<unknown>;
	destroy(): void;
}
