/*!
 * owtf JavaScript Library 
 * http://owtf.org/
 *
owtf is an OWASP+PTES-focused try to unite great tools and facilitate pen testing
Copyright (c) 2011, Abraham Aranguren <name.surname@gmail.com> Twitter: @7a_ http://7-a.org
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the copyright owner nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
	This file contains the code to handle the OWTF Review filtering
*/


function IsCounter(CounterName) {
        return (!InArray(CounterName, [ 'filtermatches_counter', 'filteroptions_counter', 'filterrefresh_counter', 'filterdelete_counter' ]))
}

function InitReviewCounters(ReviewObj, Offset) {
        ReviewObj[Offset] = {}
        for (I in window.AllCounters) {
                CounterName = window.AllCounters[I] //Below: Init only valid counters (options, refresh, delete are extra buttons only)
                if (IsCounter(CounterName)) {
                        ReviewObj[Offset][CounterName] = { 'Count': 0 }
                }
        }
}

function DisplayCounters(ReviewObj, Offset, OnlyCounter) {
        for (I in window.AllCounters) {
                CounterName = window.AllCounters[I]
                if (IsCounter(CounterName) && (!OnlyCounter || CounterName == OnlyCounter)) {
                        GetById(CounterName).style.color = ReviewObj[Offset][CounterName].Colour
                        GetById(CounterName).innerHTML = ReviewObj[Offset][CounterName].Count
                }
        }
}

function GetFilterOption(Option) {
        return Review['__FilterOptions'][Option]
}

function DisplaySelectFilterOptions() {
        for (Option in Review['__FilterOptions']) {
                Select = GetById(Option)
                //console.log('Option=', Option, 'Select=', Select)
                for (i = 0; i < Select.length; i++) {
                        //console.log('Select[' + i + ']=', Select[i])
                        //console.log('Select[' + i + '].options=', Select[i].options, 'Select[' + i + '].option=', Select[i].option, 'Select[' + i + '].value=', Select[i].value)
                        if (InArray(Select[i].value, GetFilterOption(Option))) {//Item selected
                                Select[i].selected = true
                        }
                        else { //Item not selected => Not in filter options
                                Select[i].selected = false
                        }
                }
        }
}

function GetAllSelectValues(Id, Selected) {
        Values = []
        Select = GetById(Id)
        for (i = 0; i < Select.length; i++) {
                if (!Selected || (Selected && Select.options[i].selected)) {
                        Values.push(Select.options[i].value)
                }
        }
        return Values
}

function SetSelectFilterOptions(Elem) {
        //console.log('Elem=', Elem, 'Elem.id=', Elem.id)
        SetFilterOption(Elem.id, true)
}

function SetFilterOption(Option, Selected) {
        //console.log('BEFORE SetFilterOption', "Review['__FilterOptions'][" + Option + "]=", Review['__FilterOptions'][Option])
        //console.log("GetAllSelectValues(" + Option + ", " + Selected + ")=", GetAllSelectValues(Option, Selected))
        window.Review['__FilterOptions'][Option] = GetAllSelectValues(Option, Selected)
        SaveDB()
        //console.log('AFTER SetFilterOption', "Review['__FilterOptions'][" + Option + "]=", Review['__FilterOptions'][Option])
        //console.log("GetAllSelectValues(" + Option + ", " + Selected + ")=", GetAllSelectValues(Option, Selected))
}

function InitFilterOptions() {
        Review['__FilterOptions'] = {}
        Options = [ 'SelectPluginGroup', 'SelectPluginTypesWeb', 'SelectPluginTypesAux', 'SelectWebTestGroups' ]
        for (i in Options) {
                Option = Options[i]
                SetFilterOption(Option, false)
        }
}

function DisplayUpdatedCounter(Offset, CounterName) {
        DisplayCounters(Review[Offset], "__" + Offset + "Counters" , CounterName)
        window.parent.DisplayCounters(Review, '__SummaryCounters', CounterName)
}

function UpdateCounter(Offset, CounterName, Amount) { //Increments/Decrements the parent and child counters at the same time
        //console.log('Counters BEFORE update')
        //console.log('Review = ', Review, 'Offset=', Offset, 'CounterName=', CounterName)
        //console.log('Review[' + Offset + '][__DetailedCounters][' + CounterName + '].Count=', Review[Offset]['__DetailedCounters'][CounterName].Count)
        //console.log('Review[__SummaryCounters][' + CounterName + '].Count=', Review['__SummaryCounters'][CounterName].Count)
        Review[Offset]["__" + Offset + "Counters"][CounterName].Count += Amount
        Review['__SummaryCounters'][CounterName].Count += Amount
        //console.log('Counters AFTER update')
        //console.log('Review[' + Offset + '][__DetailedCounters][' + CounterName + '].Count=', Review[Offset]['__DetailedCounters'][CounterName].Count)
        //console.log('Review[__SummaryCounters][' + CounterName + '].Count=', Review['__SummaryCounters'][CounterName].Count)
        DisplayUpdatedCounter(Offset, CounterName)
}

function UpdateCounters(Offset, CounterArray, Amount) {//Convenience function to increment several counters at once
        for (i = 0, Length = CounterArray.length; i < Length; i++) {
                UpdateCounter(Offset, CounterArray[i], Amount)
        }
}

function CanUnFilterPlugin(PluginId) {
        Plugin = GetPluginInfo(PluginId)
        if (!InArray(Plugin['Group'], GetFilterOption('SelectPluginGroup'))) return false
        if (Plugin['Group'] == 'web' &&
                (!InArray(Plugin['Type'], GetFilterOption('SelectPluginTypesWeb')) || !InArray(Plugin['Code'], GetFilterOption('SelectWebTestGroups')))) return false
        if (Plugin['Group'] == 'aux' && !InArray(Plugin['Type'], GetFilterOption('SelectPluginTypesAux'))) return false
        return true //All filters passed
}

function UnFilterPlugin(PluginId) {
        if (CanUnFilterPlugin(PluginId)) {
                //GetById('tab_'+PluginId).style.display = 'block' //Show the tab
                GetById(PluginId).parentNode.style.display = 'block' //Show the test group 
                GetById('tab_'+PluginId).parentNode.style.display = ''//Show the tab
                return 1 //Count unfiltered
        }
        return 0 //Remains filtered
}

function UnFilterPlugins(PluginIds) {
        MatchCount = 0
        for (i = 0; i < PluginIds.length; i++) {
                PluginId = PluginIds[i]
                MatchCount += UnFilterPlugin(PluginId)
        }
        return MatchCount
}

function UnFilterPluginsWhereFieldMatches(Offset, Field, Value) {
        return UnFilterPlugins(GetPluginIdsWhereFieldMatches(Offset, Field, Value))
}

function UnfilterPluginsWhereCommentsPresent(Offset) {
        AffectedPlugins = 0
        for (i = 0; i < window.AllPlugins.length; i++) {
                PluginId = window.AllPlugins[i]
                if (PluginCommentsPresent(Offset, PluginId)) {
                        AffectedPlugins += UnFilterPlugin(Offset, PluginId)
                }
        }
        return AffectedPlugins
}

function SetDisplayUnfilterPlugins(Display) {
        UnfilterPluginIcons = document.getElementsByClassName('icon_unfilter')
        for (i = 2, length = UnfilterPluginIcons.length; i < length; i++) { //NOTE: Start with i = 2 to skip the first icons on the top tabs
                IconLink = UnfilterPluginIcons[i]
                IconLink.style.display = Display
        }
}

function FilterResultsSummary(Parameter, FromReportType) { //Filter from Summary
        if ('refresh' == Parameter) {//Only refresh the page
                Refresh() //Normal page reload
                return false
        }
        TotalAffected = 0
        IPs = {}
        IPPorts = {} //To Store matches, Match count map built inside the loop below
        IFramesWithResults = []
        AllIFrames = []
        for (Offset in GetDB()) {
                if (IsReservedOffset(Offset)) continue //Skip counters
                IP = GetOffsetIP(Offset)
                InitCountDict(IPs, IP, 0)
                if (IP) {
                        InitCountDict(IPPorts, IP, {})
                        Port = GetOffsetPort(Offset)
                        InitCountDict(IPPorts[IP], Port, 0)
                }
                console.log('IP=' + IP + ', Port =' + Port)
                console.log('IPs=', IPs)
                console.log('IPPorts=', IPPorts)
                IFrameId = 'iframe_' + Offset
                IFrame = GetById(IFrameId)
                AffectedPlugins = FilterResults(Offset, Parameter, FromReportType) //Trigger action on all children iframes
                if (AffectedPlugins == 0 && 'delete' != Parameter) {
                        IFrame.className = 'iframe_hidden' //Hide iframes without results
                }
                if (AffectedPlugins > 0) { //Update Match count
                        if (IP) { IPs[IP] += AffectedPlugins }
                        if (Port) { IPPorts[IP][Port] += AffectedPlugins }
                        IFramesWithResults.push(IFrame)
                }
                AllIFrames.push(IFrame)
                TotalAffected += AffectedPlugins
        }
        if ('delete' == Parameter) { //Display everything but minimised
                DisplayMatches('') //Display number of plugins that matched
                //SetNetMapDisplay(IPs, IPPorts, null, 'none')
                SetNetMapDisplay(IPs, IPPorts, null, '')
                //auto-resize iframe depending on contents:
                for (i in AllIFrames) {
                        //IFramesWithResults[i].contentWindow.HideDetailedReportData()
                        AllIFrames[i].contentWindow.DetailedReportCollapse(Offset)
                }
        }
        else { //Hide what was not selected
                DisplayMatches(TotalAffected) //Display number of plugins that matched
                SetNetMapDisplay(IPs, IPPorts, 0, '')
                //auto-resize iframe depending on contents:
                for (i in IFramesWithResults) { IFramesWithResults[i].contentWindow.SelfAutoResize(Offset) }
        }
}

function DisplayMatches(NumMatches) {
        GetById('filtermatches_counter').innerHTML = NumMatches
}

function HideDetailedReportData(Offset) {
    //SetDisplayToAllPluginTabs('none') //Hide all plugin tabs
	
	for (var target in window.ReportsInfo) {
		SetDisplayToDivsByOffset(Offset, window.ReportsInfo[target].AllPlugins, 'none')//Hide all plugin divs
	}
		
    SetDisplayToAllTestGroups('none') //Hide all index divs
    SetDisplayToAllPluginTabs('none') //Hide all plugin tabs (it's confusing when you filter and see flags you did not filter by)
    SetDisplayUnfilterPlugins('')
    HighlightFilters('')
}

function ShowDetailedReportData(Offset) {
	for (var target in window.ReportsInfo) {
		SetDisplayToDivsByOffset(Offset, window.ReportsInfo[target].AllPlugins, 'none')//Hide all plugin divs
	}
    SetDisplayToAllTestGroups('block') //Show all index divs
    SetDisplayToAllPluginTabs('') //Hide all plugin tabs (it's confusing when you filter and see flags you did not filter by)
    SetDisplayUnfilterPlugins('')
    HighlightFilters('')
}


function FilterResults(Offset, Parameter, FromReportType) {
	if (window.ReportMode) { ToggleReportMode(Offset) } //Display Review when filter is altered, Report needs re-generation anyway
        if ('refresh' == Parameter) {//Only refresh the page
                Refresh() //Normal page reload
                return false
        }
        //Step 1 - Hide everything
        HideDetailedReportData(Offset)
        AffectedPlugins = 0
        //Step 2 - Apply filter: Show whatever is relevant
        if ('seen' == Parameter) {
                AffectedPlugins = UnFilterPluginsWhereFieldMatches(Offset, 'seen', 'Y')
        }
        else if ('unseen' == Parameter) {
                AffectedPlugins = UnFilterPluginsWhereFieldMatches(Offset, 'seen', 'N')
        }
        else if ('notes' == Parameter) {
                AffectedPlugins = UnfilterPluginsWhereCommentsPresent(Offset)
        }
        else if ('delete' == Parameter) {//Remove filter
                ShowDetailedReportData(Offset)
                //SetDisplayToAllPluginTabs('block')//Show all plugin tabs
                /*SetDisplayToAllTestGroups('block')//Show all index divs
                SetDisplayToAllPluginTabs('') //Show all plugin tabs again (display = block looks horrible :))
                SetDisplayUnfilterPlugins('none') //Undo filter for brother plugins button hidden*/
        }
        else if ('info' == Parameter) {//Show with info
                AffectedPlugins = UnFilterPluginsWhereFieldMatches(Offset, 'seen', 'Y')
                AffectedPlugins += UnFilterPluginsWhereFieldMatches(Offset, 'seen', 'N')
                SetDisplayUnfilterPlugins('none') //Undo filter for brother plugins button hidden
        }
        else if ('no_flag' == Parameter) {//Show without flags
                AffectedPlugins = UnFilterPluginsWhereFieldMatches(Offset, 'flag', 'N')
        }
        else {
                AffectedPlugins = UnFilterPluginsWhereFieldMatches(Offset, 'flag', Parameter)
        }

        if ('delete' == Parameter) {
                DisplayMatches('') //Display number of plugins that matched
                //DetailedReportCollapse(Offset) //Collapse more intuitive if performed only from Summary report
        }
        else if (FromReportType == 'NetMap') { //Called from summary report = adjust to current reduced size
                SelfAutoResize(Offset) //auto-resize iframe depending on contents
                DisplayMatches(AffectedPlugins) //Display number of plugins that matched
        }
        else { //Called from detailed report = Focus on this report (expand to 100%, set anchor, etc)
                DetailedReportAnalyse(Offset)
                DisplayMatches(AffectedPlugins) //Display number of plugins that matched
        }
        return AffectedPlugins
}

function GetFlagCount(Flag) {
	return GetById(GetCounterFromField('flag', Flag)).innerHTML
}

function GetCounterFromField(FieldName, Value) {
        CounterName = ''
        if (FieldName == 'seen') {
                if (Value == 'Y') { CounterName = 'seen'; } else { CounterName = 'unseen'; }
        }
        else if (FieldName == 'flag') {
                if (Value == 'N') { CounterName = 'no_flag'; } else { CounterName = Value; }
        }
        else if (FieldName == 'notes') CounterName = 'notes';
        if (!CounterName) {
                alert('BUG: GetCounterFromField -> Unknown counter for ' + FieldName + ' = ' + Value)
        }
        return 'filter' + CounterName + '_counter'
}

function UpdatePluginCounter(Offset, PluginId, Field, PreviousValue, NewValue) {
        if (PreviousValue != NewValue) { //Get old counter id + Decrement
                PreviousCounter = GetCounterFromField(Field, PreviousValue)
                UpdateCounter(Offset, PreviousCounter, -1)
        }
        NewCounter = GetCounterFromField(Field, NewValue)
        UpdateCounter(Offset, NewCounter, +1)
}

function UnfilterBrotherTabs(Link) {
        UL = Link.parentNode.parentNode //Go up until the <ul> element so that we can remove the style filter on the <li> elements
        for (i = 0, length = UL.childNodes.length; i < length; i++) {
                if (UL.childNodes[i].style) {
                        UL.childNodes[i].style.display = ''
                }
        }
}

function InitCountDict(Dict, Counter, Amount) {
        if (!Counter) return false
        if (!Dict[Counter]) {
                Dict[Counter] = Amount
        }
}

function SetCounterDisplay(CounterName, Display) {
        GetById(CounterName).parentNode.style.display = Display
}

function ToggleOnCount(Dict, CounterName, NumMatches, Display) {
        if (NumMatches === null) { return SetCounterDisplay(CounterName, Display) }
        if (Dict[CounterName] == NumMatches) { //No matches for Counter = hide the whole thing
                SetCounterDisplay(CounterName, 'none')
                return false
        }
        //Matches for Counter
        SetCounterDisplay(CounterName, '')
        return true
}

function SetNetMapDisplay(IPs, IPPorts, NumMatches, Display) {
        for (IP in IPs) {
                if (ToggleOnCount(IPs, IP, NumMatches, Display)) { //IP matches found, look at ports
                        for (Port in IPPorts[IP]) {
                                ToggleOnCount(IPPorts[IP], Port, NumMatches, Display)
                        }
                }
        }
}

function GetOffsetIP(Offset) {
        return GetById('ip_' + Offset).innerHTML
}

function GetOffsetPort(Offset) {
        return GetById('port_' + Offset).innerHTML
}

function GetNoMatchesFoundMessage(NumMatches) {
        if (NumMatches == 0) {
                return 'No Matches were found'
        }
        return ''
}
