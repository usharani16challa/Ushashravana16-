/**
 * @summary     DataTables
 * @description Paginate, search and sort HTML tables
 * @version     1.10.0-dev
 * @file        jquery.dataTables.js
 * @author      Allan Jardine (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 *
 * @copyright Copyright 2008-2012 Allan Jardine, all rights reserved.
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, available at:
 *   http://datatables.net/license_gpl2
 *   http://datatables.net/license_bsd
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

/*jslint evil: true, undef: true, browser: true */
/*globals $,require,jQuery,define,_fnExternApiFunc,_fnInitialise,_fnInitComplete,_fnLanguageCompat,_fnAddColumn,_fnColumnOptions,_fnAddData,_fnCreateTr,_fnGatherData,_fnBuildHead,_fnDrawHead,_fnDraw,_fnReDraw,_fnAjaxUpdate,_fnAjaxParameters,_fnAjaxUpdateDraw,_fnAddOptionsHtml,_fnFeatureHtmlTable,_fnScrollDraw,_fnAdjustColumnSizing,_fnFeatureHtmlFilter,_fnFilterComplete,_fnFilterCustom,_fnFilterColumn,_fnFilter,_fnBuildSearchArray,_fnBuildSearchRow,_fnFilterCreateSearch,_fnDataToSearch,_fnSort,_fnSortAttachListener,_fnSortingClasses,_fnFeatureHtmlPaginate,_fnPageChange,_fnFeatureHtmlInfo,_fnUpdateInfo,_fnFeatureHtmlLength,_fnFeatureHtmlProcessing,_fnProcessingDisplay,_fnVisibleToColumnIndex,_fnColumnIndexToVisible,_fnNodeToDataIndex,_fnVisbleColumns,_fnCalculateEnd,_fnConvertToWidth,_fnCalculateColumnWidths,_fnScrollingWidthAdjust,_fnGetWidestNode,_fnGetMaxLenString,_fnStringToCss,_fnDetectType,_fnSettingsFromNode,_fnGetDataMaster,_fnGetTrNodes,_fnGetTdNodes,_fnEscapeRegex,_fnDeleteIndex,_fnColumnOrdering,_fnLog,_fnClearTable,_fnSaveState,_fnLoadState,_fnDetectHeader,_fnGetUniqueThs,_fnScrollBarWidth,_fnApplyToChildren,_fnMap,_fnGetRowData,_fnGetCellData,_fnSetCellData,_fnGetObjectDataFn,_fnSetObjectDataFn,_fnApplyColumnDefs,_fnBindAction,_fnCallbackReg,_fnCallbackFire,_fnNodeToColumnIndex,_fnInfoMacros,_fnBrowserDetect,_fnGetColumns,_fnHungarianMap,_fnCamelToHungarian,_fnBuildAjax,_fnAjaxDataSrc*/

(/** @lends <global> */function( window, document, undefined ) {

(function( factory ) {
	"use strict";

	// Define as an D module if possible
	if ( typeof define === 'function' && define.amd )
	{
		define( ['jquery'], factory );
	}
	/* Define using browser globals otherwise
	 * Prevent multiple instantiations if the script is loaded twice
	 */
	else if ( jQuery && !jQuery.fn.dataTable )
	{
		factory( jQuery );
	}
}
(/** @lends <global> */function( $ ) {
	"use strict";

	/**
	 * DataTables is a plug-in for the jQuery Javascript library. It is a highly
	 * flexible tool, based upon the foundations of progressive enhancement,
	 * which will add advanced interaction controls to any HTML table. For a
	 * full list of features please refer to
	 * [DataTables.net](href="http://datatables.net).
	 *
	 * Note that the `DataTable` object is not a global variable but is aliased
	 * to `jQuery.fn.DataTable` and `jQuery.fn.dataTable` through which it may
	 * be  accessed.
	 *
	 *  @class
	 *  @param {object} [init={}] Configuration object for DataTables. Options
	 *    are defined by {@link DataTable.defaults}
	 *  @requires jQuery 1.3+
	 *
	 *  @example
	 *    // Basic initialisation
	 *    $(document).ready( function {
	 *      $('#example').dataTable();
	 *    } );
	 *
	 *  @example
	 *    // Initialisation with configuration options - in this case, disable
	 *    // pagination and sorting.
	 *    $(document).ready( function {
	 *      $('#example').dataTable( {
	 *        "paginate": false,
	 *        "sort": false
	 *      } );
	 *    } );
	 */
	var DataTable;

	
	
	/**
	 * Create a mapping object that allows camel case parameters to be looked up
	 * for their Hungarian counterparts. The mapping is stored in a private
	 * parameter called `_hungaianMap` which can be accessed on the source object.
	 *  @param {object} o 
	 *  @memberof DataTable#oApi
	 */
	function _fnHungarianMap ( o )
	{
		var
			hungarian = 'a aa ao as b fn i m o s ',
			match,
			newKey,
			map = {};
	
		$.each( o, function (key, val) {
			match = key.match(/^([^A-Z]+?)([A-Z])/);
	
			if ( match && hungarian.indexOf(match[1]+' ') !== -1 )
			{
				newKey = key.replace( match[0], match[2].toLowerCase() );
				map[ newKey ] = key;
	
				if ( match[1] === 'o' )
				{
					_fnHungarianMap( o[key] );
				}
			}
		} );
	
		o._hungaianMap = map;
	}
	
	
	/**
	 * Convert from camel case parameters to Hungarian, based on a Hungarian map
	 * created by _fnHungarianMap.
	 *  @param {object} src The model object which holds all parameters that can be
	 *    mapped.
	 *  @param {object} user The object to convert from camel case to Hungarian.
	 *  @param {boolean} force When set to `true`, properties which already have a
	 *    Hungarian value in the `user` object will be overwritten. Otherwise they
	 *    won't be.
	 *  @memberof DataTable#oApi
	 */
	function _fnCamelToHungarian ( src, user, force )
	{
		if ( ! src._hungaianMap )
		{
			_fnHungarianMap( src );
		}
	
		var hungarianKey;
	
		$.each( user, function (key, val) {
			hungarianKey = src._hungaianMap[ key ];
	
			if ( hungarianKey !== undefined && (force || user[hungarianKey] === undefined) )
			{
				user[hungarianKey] = user[ key ];
	
				if ( hungarianKey.charAt(0) === 'o' )
				{
					_fnCamelToHungarian( src[hungarianKey], user[key] );
				}
			}
		} );
	}
	
	
	/**
	 * Language compatibility - when certain options are given, and others aren't, we
	 * need to duplicate the values over, in order to provide backwards compatibility
	 * with older language files.
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnLanguageCompat( oLanguage )
	{
		var oDefaults = DataTable.defaults.oLanguage;
	
		/* Backwards compatibility - if there is no sEmptyTable given, then use the same as
		 * sZeroRecords - assuming that is given.
		 */
		if ( !oLanguage.sEmptyTable && oLanguage.sZeroRecords &&
			oDefaults.sEmptyTable === "No data available in table" )
		{
			_fnMap( oLanguage, oLanguage, 'sZeroRecords', 'sEmptyTable' );
		}
	
		/* Likewise with loading records */
		if ( !oLanguage.sLoadingRecords && oLanguage.sZeroRecords &&
			oDefaults.sLoadingRecords === "Loading..." )
		{
			_fnMap( oLanguage, oLanguage, 'sZeroRecords', 'sLoadingRecords' );
		}
	}
	
	
	/**
	 * Browser feature detection for capabilities, quirks
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnBrowserDetect( oSettings )
	{
		// Scrolling feature / quirks detection
		var n = $(
			'<div style="position:absolute; top:0; left:0; height:1px; width:1px; overflow:hidden">'+
				'<div style="position:absolute; top:1px; left:1px; width:100px; overflow:scroll;">'+
					'<div id="DT_BrowserTest" style="width:100%; height:10px;"></div>'+
				'</div>'+
			'</div>')[0];
	
		document.body.appendChild( n );
		// IE6/7 will oversize a width 100% element inside a scrolling element, to
		// include the width of the scrollbar, while other browsers ensure the inner
		// element is contained without forcing scrolling
		oSettings.oBrowser.bScrollOversize = $('#DT_BrowserTest', n)[0].offsetWidth === 100 ? true : false;
	
		// In rtl text layout, some browsers (most, but not all) will place the
		// scrollbar on the left, rather than the right.
		oSettings.oBrowser.bScrollbarLeft = $('#DT_BrowserTest', n).offset().left !== 1 ? true : false;
		document.body.removeChild( n );
	}
	
	
	/**
	 * Add a column to the list used for the table with default values
	 *  @param {object} oSettings dataTables settings object
	 *  @param {node} nTh The th element for this column
	 *  @memberof DataTable#oApi
	 */
	function _fnAddColumn( oSettings, nTh )
	{
		var oDefaults = DataTable.defaults.column;
		var iCol = oSettings.aoColumns.length;
		var oCol = $.extend( {}, DataTable.models.oColumn, oDefaults, {
			"sSortingClass": oSettings.oClasses.sSortable,
			"sSortingClassJUI": oSettings.oClasses.sSortJUI,
			"nTh": nTh ? nTh : document.createElement('th'),
			"sTitle":    oDefaults.sTitle    ? oDefaults.sTitle    : nTh ? nTh.innerHTML : '',
			"aDataSort": oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
			"mData": oDefaults.mData ? oDefaults.oDefaults : iCol
		} );
		oSettings.aoColumns.push( oCol );
		
		/* Add a column specific filter */
		if ( oSettings.aoPreSearchCols[ iCol ] === undefined || oSettings.aoPreSearchCols[ iCol ] === null )
		{
			oSettings.aoPreSearchCols[ iCol ] = $.extend( {}, DataTable.models.oSearch );
		}
		else
		{
			var oPre = oSettings.aoPreSearchCols[ iCol ];
			
			/* Don't require that the user must specify bRegex, bSmart or bCaseInsensitive */
			if ( oPre.bRegex === undefined )
			{
				oPre.bRegex = true;
			}
			
			if ( oPre.bSmart === undefined )
			{
				oPre.bSmart = true;
			}
			
			if ( oPre.bCaseInsensitive === undefined )
			{
				oPre.bCaseInsensitive = true;
			}
		}
		
		/* Use the column options function to initialise classes etc */
		_fnColumnOptions( oSettings, iCol, null );
	}
	
	
	/**
	 * Apply options for a column
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iCol column index to consider
	 *  @param {object} oOptions object with sType, bVisible and bSearchable etc
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnOptions( oSettings, iCol, oOptions )
	{
		var oCol = oSettings.aoColumns[ iCol ];
		
		/* User specified column options */
		if ( oOptions !== undefined && oOptions !== null )
		{
			// Map camel case parameters to their Hungarian counterparts
			_fnCamelToHungarian( DataTable.defaults.column, oOptions );
			
			/* Backwards compatibility for mDataProp */
			if ( oOptions.mDataProp !== undefined && !oOptions.mData )
			{
				oOptions.mData = oOptions.mDataProp;
			}
	
			if ( oOptions.sType !== undefined )
			{
				oCol.sType = oOptions.sType;
				oCol._bAutoType = false;
			}
			
			$.extend( oCol, oOptions );
			_fnMap( oCol, oOptions, "sWidth", "sWidthOrig" );
	
			/* iDataSort to be applied (backwards compatibility), but aDataSort will take
			 * priority if defined
			 */
			if ( oOptions.iDataSort !== undefined )
			{
				oCol.aDataSort = [ oOptions.iDataSort ];
			}
			_fnMap( oCol, oOptions, "aDataSort" );
		}
	
		/* Cache the data get and set functions for speed */
		var mRender = oCol.mRender ? _fnGetObjectDataFn( oCol.mRender ) : null;
		var mData = _fnGetObjectDataFn( oCol.mData );
	
		oCol.fnGetData = function (oData, sSpecific) {
			var innerData = mData( oData, sSpecific );
	
			if ( oCol.mRender && (sSpecific && sSpecific !== '') )
			{
				return mRender( innerData, sSpecific, oData );
			}
			return innerData;
		};
		oCol.fnSetData = _fnSetObjectDataFn( oCol.mData );
		
		/* Feature sorting overrides column specific when off */
		if ( !oSettings.oFeatures.bSort )
		{
			oCol.bSortable = false;
		}
		
		/* Check that the class assignment is correct for sorting */
		if ( !oCol.bSortable ||
			 ($.inArray('asc', oCol.asSorting) == -1 && $.inArray('desc', oCol.asSorting) == -1) )
		{
			oCol.sSortingClass = oSettings.oClasses.sSortableNone;
			oCol.sSortingClassJUI = "";
		}
		else if ( $.inArray('asc', oCol.asSorting) == -1 && $.inArray('desc', oCol.asSorting) == -1 )
		{
			oCol.sSortingClass = oSettings.oClasses.sSortable;
			oCol.sSortingClassJUI = oSettings.oClasses.sSortJUI;
		}
		else if ( $.inArray('asc', oCol.asSorting) != -1 && $.inArray('desc', oCol.asSorting) == -1 )
		{
			oCol.sSortingClass = oSettings.oClasses.sSortableAsc;
			oCol.sSortingClassJUI = oSettings.oClasses.sSortJUIAscAllowed;
		}
		else if ( $.inArray('asc', oCol.asSorting) == -1 && $.inArray('desc', oCol.asSorting) != -1 )
		{
			oCol.sSortingClass = oSettings.oClasses.sSortableDesc;
			oCol.sSortingClassJUI = oSettings.oClasses.sSortJUIDescAllowed;
		}
	}
	
	
	/**
	 * Adjust the table column widths for new data. Note: you would probably want to 
	 * do a redraw after calling this function!
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnAdjustColumnSizing ( oSettings )
	{
		/* Not interested in doing column width calculation if auto-width is disabled */
		if ( oSettings.oFeatures.bAutoWidth === false )
		{
			return false;
		}
		
		_fnCalculateColumnWidths( oSettings );
		for ( var i=0 , iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
		{
			oSettings.aoColumns[i].nTh.style.width = oSettings.aoColumns[i].sWidth;
		}
	}
	
	
	/**
	 * Covert the index of a visible column to the index in the data array (take account
	 * of hidden columns)
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iMatch Visible column index to lookup
	 *  @returns {int} i the data index
	 *  @memberof DataTable#oApi
	 */
	function _fnVisibleToColumnIndex( oSettings, iMatch )
	{
		var aiVis = _fnGetColumns( oSettings, 'bVisible' );
	
		return typeof aiVis[iMatch] === 'number' ?
			aiVis[iMatch] :
			null;
	}
	
	
	/**
	 * Covert the index of an index in the data array and convert it to the visible
	 *   column index (take account of hidden columns)
	 *  @param {int} iMatch Column index to lookup
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {int} i the data index
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnIndexToVisible( oSettings, iMatch )
	{
		var aiVis = _fnGetColumns( oSettings, 'bVisible' );
		var iPos = $.inArray( iMatch, aiVis );
	
		return iPos !== -1 ? iPos : null;
	}
	
	
	/**
	 * Get the number of visible columns
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {int} i the number of visible columns
	 *  @memberof DataTable#oApi
	 */
	function _fnVisbleColumns( oSettings )
	{
		return _fnGetColumns( oSettings, 'bVisible' ).length;
	}
	
	
	/**
	 * Get an array of column indexes that match a given property
	 *  @param {object} oSettings dataTables settings object
	 *  @param {string} sParam Parameter in aoColumns to look for - typically 
	 *    bVisible or bSearchable
	 *  @returns {array} Array of indexes with matched properties
	 *  @memberof DataTable#oApi
	 */
	function _fnGetColumns( oSettings, sParam )
	{
		var a = [];
	
		$.map( oSettings.aoColumns, function(val, i) {
			if ( val[sParam] ) {
				a.push( i );
			}
		} );
	
		return a;
	}
	
	
	/**
	 * Get the sort type based on an input string
	 *  @param {string} sData data we wish to know the type of
	 *  @returns {string} type (defaults to 'string' if no type can be detected)
	 *  @memberof DataTable#oApi
	 */
	function _fnDetectType( sData )
	{
		var aTypes = DataTable.ext.aTypes;
		var iLen = aTypes.length;
		
		for ( var i=0 ; i<iLen ; i++ )
		{
			var sType = aTypes[i]( sData );
			if ( sType !== null )
			{
				return sType;
			}
		}
		
		return 'string';
	}
	
	
	/**
	 * Get the column ordering that DataTables expects
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {string} comma separated list of names
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnOrdering ( oSettings )
	{
		var sNames = '';
		for ( var i=0, iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
		{
			sNames += oSettings.aoColumns[i].sName+',';
		}
		if ( sNames.length == iLen )
		{
			return "";
		}
		return sNames.slice(0, -1);
	}
	
	
	/**
	 * Take the column definitions and static columns arrays and calculate how
	 * they relate to column indexes. The callback function will then apply the
	 * definition found for a column to a suitable configuration object.
	 *  @param {object} oSettings dataTables settings object
	 *  @param {array} aoColDefs The aoColumnDefs array that is to be applied
	 *  @param {array} aoCols The aoColumns array that defines columns individually
	 *  @param {function} fn Callback function - takes two parameters, the calculated
	 *    column index and the definition for that column.
	 *  @memberof DataTable#oApi
	 */
	function _fnApplyColumnDefs( oSettings, aoColDefs, aoCols, fn )
	{
		var i, iLen, j, jLen, k, kLen;
	
		// Column definitions with aTargets
		if ( aoColDefs )
		{
			/* Loop over the definitions array - loop in reverse so first instance has priority */
			for ( i=aoColDefs.length-1 ; i>=0 ; i-- )
			{
				/* Each definition can target multiple columns, as it is an array */
				var aTargets = aoColDefs[i].targets || aoColDefs[i].aTargets;
				if ( ! $.isArray( aTargets ) )
				{
					_fnLog( oSettings, 1, 'aTargets must be an array of targets, not a '+(typeof aTargets) );
				}
	
				for ( j=0, jLen=aTargets.length ; j<jLen ; j++ )
				{
					if ( typeof aTargets[j] === 'number' && aTargets[j] >= 0 )
					{
						/* Add columns that we don't yet know about */
						while( oSettings.aoColumns.length <= aTargets[j] )
						{
							_fnAddColumn( oSettings );
						}
	
						/* Integer, basic index */
						fn( aTargets[j], aoColDefs[i] );
					}
					else if ( typeof aTargets[j] === 'number' && aTargets[j] < 0 )
					{
						/* Negative integer, right to left column counting */
						fn( oSettings.aoColumns.length+aTargets[j], aoColDefs[i] );
					}
					else if ( typeof aTargets[j] === 'string' )
					{
						/* Class name matching on TH element */
						for ( k=0, kLen=oSettings.aoColumns.length ; k<kLen ; k++ )
						{
							if ( aTargets[j] == "_all" ||
							     $(oSettings.aoColumns[k].nTh).hasClass( aTargets[j] ) )
							{
								fn( k, aoColDefs[i] );
							}
						}
					}
				}
			}
		}
	
		// Statically defined columns array
		if ( aoCols )
		{
			for ( i=0, iLen=aoCols.length ; i<iLen ; i++ )
			{
				fn( i, aoCols[i] );
			}
		}
	}
	
	/**
	 * Add a data array to the table, creating DOM node etc. This is the parallel to 
	 * _fnGatherData, but for adding rows from a Javascript source, rather than a
	 * DOM source.
	 *  @param {object} oSettings dataTables settings object
	 *  @param {array} aData data array to be added
	 *  @param {node} [nTr] TR element to add to the table - optional. If not given,
	 *    DataTables will create a row automatically
	 *  @param {array} [anTds] Array of TD|TH elements for the row - must be given
	 *    if nTr is.
	 *  @returns {int} >=0 if successful (index of new aoData entry), -1 if failed
	 *  @memberof DataTable#oApi
	 */
	function _fnAddData ( oSettings, aDataIn, nTr, anTds )
	{
		var oCol;
		
		/* Create the object for storing information about this new row */
		var iRow = oSettings.aoData.length;
		var oData = $.extend( true, {}, DataTable.models.oRow );
		
		oData._aData = aDataIn;
		oSettings.aoData.push( oData );
	
		/* Create the cells */
		var nTd, sThisType;
		for ( var i=0, iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
		{
			oCol = oSettings.aoColumns[i];
	
			_fnSetCellData( oSettings, iRow, i, _fnGetCellData( oSettings, iRow, i ) );
			
			/* See if we should auto-detect the column type */
			if ( oCol._bAutoType && oCol.sType != 'string' )
			{
				/* Attempt to auto detect the type - same as _fnGatherData() */
				var sVarType = _fnGetCellData( oSettings, iRow, i, 'type' );
				if ( sVarType !== null && sVarType !== '' )
				{
					sThisType = _fnDetectType( sVarType );
					if ( oCol.sType === null )
					{
						oCol.sType = sThisType;
					}
					else if ( oCol.sType != sThisT