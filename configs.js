const dashboardConfig = {
    name : 'DASHBOARD',
    data : {
        landing_page : [
            {
                field_name : 'SmartHeader',
                getTabs : '/interface/configs?data=Tabs'
            },
            {
                field_name : 'TextInput',
                path : 'components.userName'
            }
        ]
    }
};

module.exports = {
    dashboardConfig
};
