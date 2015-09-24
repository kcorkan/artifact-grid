Ext.define("artifact-grid", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    config: {
        defaultSettings: {
            modelNames: ['hierarchicalrequirement', 'defect'],
         }
    },

    launch: function() {
        this._buildStore();
    },

    _buildStore: function(){
        if (this.down('rallygridboard')){
            this.down('rallygridboard').destroy();
        }

        var query = this.getSetting('query') || '',
            filters = [];

        if ( !Ext.isEmpty(query) ) {
            filters = Rally.data.wsapi.Filter.fromQueryString(query);
        }
        this.logger.log('_buildStore', this.getSetting('modelNames'), this.getSetting('query'),filters);

        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: this.getSetting('modelNames'),
           // filters: filters,
            enableHierarchy: true
        }).then({
            success: this._onStoreBuilt,
            scope: this
        });

    },
    _onStoreBuilt: function(store) {
        var modelNames = this.getSetting('modelNames'),
            context = this.getContext();

        this.add({
            xtype: 'rallygridboard',
            context: context,
            modelNames: modelNames,
            toggleState: 'grid',
            stateful: true,
            plugins: [
                {
                    ptype: 'rallygridboardcustomfiltercontrol',
                    filterControlConfig: {
                        modelNames: modelNames,
                        stateful: true,
                        stateId: context.getScopedStateId('custom-filter')
                    },
                    showOwnerFilter: true,
                    ownerFilterControlConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('owner-filter')
                    }
                },{
                    ptype: 'rallygridboardfieldpicker',
                    headerPosition: 'left',
                    modelNames: modelNames,
                    stateful: true,
                    stateId: context.getScopedStateId('columns')

                },{
                    ptype: 'rallygridboardactionsmenu',
                    menuItems: [
                        {
                            text: 'Export...',
                            handler: function() {
                                var csv = Rally.technicalservices.FileUtilities.getCSVFromGridboardGrid(this.down('rallygridboard').getGridOrBoard(), modelNames).then({
                                    success: function(csv){
                                        Rally.technicalservices.FileUtilities.saveCSVToFile(csv, "export.csv");
                                    }
                                });
                            },
                            scope: this
                        }
                    ],
                    buttonConfig: {
                        iconCls: 'icon-export'
                    }
                }
            ],
            gridConfig: {
                store: store,
                columnCfgs: [
                    'FormattedID',
                    'Name'
                ]
            },
            height: this.getHeight()
        });
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    }
});
