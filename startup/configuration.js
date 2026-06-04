if (typeof module != 'undefined' && typeof Enums == 'undefined') {
    Enums = require('./scripts/data/enums');
}

const Configuration = {
    WORKSTATION_WIDTH: 2,
    WORKSTATION_HEIGHT: 2,
    GRID_SIZE: 20,
    CELL_PRICE: 15,
    DAYS_IN_MONTH: 30,
    CURRENCY_FORMAT: '$0,0',
    CURRENCY_FORMAT_NOSIGN: '0,0',
    USE_TEST_SAVEGAME: true,
    VERSION: 1,
    SUBVERSION: 24,
    InitialCallInSickDaysLeft: 60,
    MS_PER_TICK: 150,
        TASK_BASED_EMPLOYEE_TYPES: [
    Enums.EmployeeTypeNames.Designer,
    Enums.EmployeeTypeNames.Developer,
    Enums.EmployeeTypeNames.SalesExecutive,
        Enums.EmployeeTypeNames.OutsourcingExecutive,
        Enums.EmployeeTypeNames.LeadDeveloper,
        Enums.EmployeeTypeNames.Researcher,
        Enums.EmployeeTypeNames.Marketer,
        Enums.EmployeeTypeNames.SysAdmin,
        Enums.EmployeeTypeNames.Supporter,
        Enums.EmployeeTypeNames.ChiefExecutiveOfficer,
        Enums.EmployeeTypeNames.Recruiter],
    PRODUCTION_BASED_EMPLOYEE_TYPES: [
        Enums.EmployeeTypeNames.Designer,
        Enums.EmployeeTypeNames.Developer,
        Enums.EmployeeTypeNames.LeadDeveloper,
        Enums.EmployeeTypeNames.Marketer,
        Enums.EmployeeTypeNames.SysAdmin,
        Enums.EmployeeTypeNames.Supporter],
    MINUTES_PER_RESEARCH_POINT: 75,
    MAX_CU_FROM_VIRTUAL_SERVERS: 150000,
    PAGEVIEWS_PER_USER_PER_MINUTE: 0.5,
    AD_SPACE_MAX_QUEUE: 40,
    MINUTES_PER_LEAD: 800,
    DDOS_ATTACK_MULTIPLIER: 2,
    VIRAL_BOOST_MULTIPLIER: 100,
    PRICE_EXPECTATION_MINIMUM: 1.9,
    PRICE_EXPECTATION_MAXIMUM: 4.3,
    HOURS_TO_RESOLVE_TICKETS: 36,
    INTERNET_POPULATION: 3400000000,
    INVESTMENT_PROJECT_MIN_DAYS: 800,
    TAX_BRACKETS: {
        base: { percentage: 0.4 },
        mid: { percentage: 0.2, start: 30000000 },
        high: { percentage: 0.3, start: 70000000 },
    },
    RETIREMENT_FUND_GOAL: 50000000,
    SELL_WEBSITE_TAXES: 25,
    SELL_WEBSITE_TRADING_FEE: 5,
    EMPLOYEE_UPGRADE_PRICE: 3000,
};

if (typeof module != 'undefined') {
    module.exports = Configuration;
}
