const { User, Report, Office } = require("../models");
require("dotenv").config();
const { BETA } = process.env;

class ReportsServices {
  static async getAllReports() {
    try {
      const allReports = await Report.find({}).populate(["issuer", "solver"])
      return { error: false, data: allReports };
    } catch (error) {
      return { error: true, data: error };
    }
  }
  static async getOneReport(id) {
    try {
      const report = await Report.findById(id).populate(["issuer", "solver", "office"])
      return { error: false, data: report };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async getReports(userId, role) {
    try {
      const allServiceReports = await Report.find({ [role]: userId }).populate(["issuer", "solver", "office"]);
      return { error: false, data: allServiceReports };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async createNewReport(report, userId, serviceId) {
    try {
      const newReport = await Report.create(report);
      newReport.issuer = userId;
      newReport.solver = serviceId;
      newReport.save();
      const office = await Office.findById(newReport.office);
      office.openReports += 1;
      office.save();
      const updatedService = await User.findById(serviceId);
      updatedService.activeReports += 1;
      updatedService.save();
      return { error: false, data: newReport };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async editStateReport(reportId, status) {
    try {
      const checkStatus = await Report.findById(reportId);
      if (checkStatus.status === "closed") return { error: true, data: "Report already closed" };
      const reportStateUpdated = await Report.findByIdAndUpdate(
        reportId,
        { status },
        {
          runValidators: true,
          new: true,
        }
      );
      if (status === "closed") {
        const office = await Office.findById(reportStateUpdated.office);
        office.openReports -= 1;
        office.save();
        const updatedService = await User.findById(reportStateUpdated.solver);
        updatedService.activeReports -= 1;
        updatedService.save();
      }
      return { error: false, data: reportStateUpdated };
    } catch (error) {
      return { error: true, data: error };
    }
  }

  static async deleteReport(reportId) {
    try {
      const deletedReport = await Report.findByIdAndDelete(reportId);
      const office = await Office.findById(deletedReport.office.toString());
      office.openReports -= 1;
      office.save();
      const updatedService = await User.findById(deletedReport.solver.toString());
      updatedService.activeReports -= 1;
      updatedService.save();
      return { error: false, data: deletedReport };
    } catch (error) {
      return { error: true, data: error };
    }
  }
  static async nearOffices(coor) {
    try {
      const arrNearOff = await Office.aggregate([
        {
          $geoNear: {
            near: coor,
            spherical: true,
            distanceField: "calcDistance",
            distanceMultiplier: 0.001,
          },
        },
      ]);
      return { error: false, data: arrNearOff };
    } catch (error) {
      return { error: true, data: error };
    }
  }
  static async selectService(officeId, issuerId) {
    try {
      const allUsers = await User.find({ office: officeId });
      const service = allUsers
        .filter((user) => user.type === BETA)
        .sort((a, b) => a.activeReports - b.activeReports);
      if (service[0]._id.toString() === issuerId.toString()) return { error: false, data: service[1] }
      return { error: false, data: service[0] };
    } catch (error) {
      return { error: true, data: error };
    }
  }
}

module.exports = ReportsServices;
