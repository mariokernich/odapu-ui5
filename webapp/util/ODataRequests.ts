import ManagedObject from "sap/ui/base/ManagedObject";
import Constants from "../Constants";
import { Project, ServiceEntity } from "../Types";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";

/**
 * @namespace de.kernich.odpu.util
 */
export default class ODataRequests extends ManagedObject {
	private model: ODataModel;

	constructor(model: ODataModel) {
		super();
		this.model = model;
	}

	public getModel(): ODataModel {
		return this.model;
	}

	async getServices(): Promise<ServiceEntity[]> {
		return new Promise((resolve, reject) => {
			this.model.read("/serviceSet", {
				success: (data: { results: ServiceEntity[] }) => {
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
			this.model.read("/odataProjectSet", {
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
			this.model.create("/odataProjectSet", project, {
				success: () => resolve(),
				error: reject
			});
		});
	}
	
	async deleteProject(project: Project): Promise<void> {
		return new Promise((resolve, reject) => {
			const sPath = this.model.createKey("/odataProjectSet", {
				ProjectName: project.ProjectName
			});
			this.model.remove(sPath, {
				success: () => resolve(),
				error: reject
			});
		});
	}
}
