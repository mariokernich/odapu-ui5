import ManagedObject from "sap/ui/base/ManagedObject";
import Constants from "../Constants";
import { InfoEntity, Project, PushChannelEntity, ServiceEntity } from "../Types";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";

/**
 * @namespace de.kernich.odpu.util
 */
export default class ODataRequests extends ManagedObject {
	private model: ODataModel;
	private static cachedServices: ServiceEntity[] | null = null;

	constructor(model: ODataModel) {
		super();
		this.model = model;
	}

	public getModel(): ODataModel {
		return this.model;
	}

	async getServices(options: { refresh: boolean } = { refresh: false }): Promise<ServiceEntity[]> {
		if (!options.refresh && ODataRequests.cachedServices) {
			return ODataRequests.cachedServices;
		}

		return new Promise((resolve, reject) => {
			this.model.read("/ODataService", {
				success: (data: { results: ServiceEntity[] }) => {
					ODataRequests.cachedServices = data.results;
					resolve(data.results);
				},
				error: reject,
				urlParameters: {
					$top: Constants.SERVICE_QUERY_LIMIT.toString(),
				},
			});
		});
	}

	async getInfo(): Promise<InfoEntity> {
		return new Promise((resolve, reject) => {
			this.model.read("/Info", {
				success: (data: { results: InfoEntity[] }) => {
					resolve(data.results[0]);
				},
				error: reject,
			});
		});
	}

	async getPushChannels(): Promise<PushChannelEntity[]> {
		return new Promise((resolve, reject) => {
			this.model.read("/PushChannel", {
				success: (data: { results: PushChannelEntity[] }) => {
					resolve(data.results);
				},
				error: reject,
				urlParameters: {
					$top: Constants.SERVICE_QUERY_LIMIT.toString(),
				},
			});
		});
	}

	async getProjects(): Promise<Project[]> {
		return new Promise((resolve, reject) => {
			this.model.read("/ODataServiceProject", {
				success: (data: { 
					results: Project[]
				}) => {
					resolve(data.results as unknown as Project[]);
				},
				error: reject,
			});
		});
	}

	async createProject(project: Project): Promise<void> {
		return new Promise((resolve, reject) => {
			this.model.create("/ODataServiceProject", project, {
				success: () => resolve(),
				error: reject
			});
		});
	}
	
	async deleteProject(project: Project): Promise<void> {
		return new Promise((resolve, reject) => {
			const sPath = this.model.createKey("/ODataServiceProject", {
				ProjectName: project.ProjectName
			});
			this.model.remove(sPath, {
				success: () => resolve(),
				error: reject
			});
		});
	}

	async markAsFavorite(options: {
		servicePath: string;
		isFavorite: boolean;
	}): Promise<void> {
		return new Promise((resolve, reject) => {
			this.model.callFunction("/mark_favorite", {
				success: () => resolve(),
				error: reject,
				urlParameters: {
					ProjectName: "",
					ServicePath: options.servicePath,
					Value: options.isFavorite,
				},
				method: "POST",
			});
		});
	}
}
