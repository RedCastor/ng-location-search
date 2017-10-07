(function(angular){
    'use strict';

    angular.module('ngLocationSearch', []).directive('ngLocationSearch', ['$log', '$timeout', '$location', '$window', '$parse', '$httpParamSerializer', function ($log, $timeout, $location, $window, $parse, $httpParamSerializer) {
        return {
            restrict: "A",
            require: ['?ngModel', '?^form'],
            link: function (scope, elem, attrs, Ctrl) {

                var search_keys;

                /**
                 * Set the controllers for model and form
                 */
                var modelCtrl = Ctrl[0];
                var formCtrl = Ctrl[1];


                /**
                 * Trailling Slash Url
                 *
                 * @param url
                 */
                function trailling_slash (url) {

                    if ( angular.isString(url) ) {
                        return url.replace(/\/$/, '');
                    }

                    return false;
                }


                /**
                 * Parse value for set the location search.
                 *
                 * @param value
                 */
                function parseLocationSearch(value) {

                    if (!value) {
                        return;
                    }

                    var new_search = {};
                    var reset_search = scope.$eval(attrs.ngLocationSearchReset);
                    var location_href = trailling_slash(attrs.ngLocationSearchUrl);
                    var abs_url = trailling_slash($window.location.href.replace($window.location.hash, ''));

                    //Deserializes a JSON search string.
                    try {
                        var value_object = angular.fromJson(value);

                        value = value_object;
                    }
                    catch(err) {

                    }

                    //Apply key val on location search.
                    angular.forEach(search_keys, function (key, val) {
                        var search_val = null;

                        if (angular.isObject(value) && angular.isDefined(value[key]) ) {
                            search_val = value[key];
                        }
                        else if (angular.isString(value)) {
                            search_val = value;
                        }

                        new_search[key] = search_val !== '' ? search_val : null;
                    });

                    var current_search = $location.search();

                    if (!reset_search) {
                        new_search = angular.extend({}, current_search, new_search);
                    }

                    //Redirect to search url
                    if (angular.isString(location_href) && location_href !== abs_url) {

                        var path_url = $location.path();
                        var hash_url = trailling_slash($window.location.hash.replace($location.url(), ''));
                        var param_url = $httpParamSerializer(new_search);

                        path_url = path_url ? '/' : '';
                        param_url = param_url ? '?' + param_url : '';
                        var new_href = location_href + '/' + hash_url + path_url + param_url ;

                        $window.location.href = new_href;

                        $log.debug(new_href);
                    }
                    else {
                        $timeout(function() {
                            $location.search(new_search);
                        });
                    }
                }

                //Use the current model scope.
                //Only if attribute is set
                if (attrs.ngLocationSearch && (modelCtrl || formCtrl)) {

                    search_keys = scope.$eval(attrs.ngLocationSearch);
                    search_keys = angular.isArray(search_keys) ? search_keys : [attrs.ngLocationSearch];
                    var search = null;

                    //Set the model change from location search object.
                    var changeModel = function (loc_search) {
                        search = (search_keys.length > 1) ? {} : null;

                        //Find in url search params
                        angular.forEach(search_keys, function (key, val) {

                            if (angular.isObject(search)) {
                                search[key] = angular.isDefined(loc_search[key]) ? loc_search[key] : null;
                            }
                            else if (angular.isDefined(loc_search[key])) {
                                search = loc_search[key];
                            }
                        });

                        //transform selected search to string
                        if (angular.isObject(search)) {
                            search = angular.toJson(search);
                        }

                        //Set default model value.
                        var getter = $parse(attrs.ngModel);
                        var setter = getter.assign;
                        setter(scope, search);
                    };



                    //Set the model change from location search object.
                    var changeForm = function (loc_search) {
                        var fields = scope.$eval(attrs.ngSubmit);

                        if (!fields && angular.isObject(fields)) {
                            return;
                        }

                        if ( angular.isUndefined(scope[attrs.ngSubmit]) ) {
                            scope[attrs.ngSubmit] = {};
                        }

                        //Find in url search params
                        angular.forEach(search_keys, function (key, val) {

                            if (angular.isDefined(loc_search[key])) {

                                //Set default form value.
                                scope[attrs.ngSubmit][key] = loc_search[key];
                            }
                        });
                    };


                    /**
                     * Evaluate location search attribute if is ngModel
                     */
                    if ( modelCtrl ) {

                        //Watch model change
                        scope.$watch(function () {
                                return modelCtrl.$modelValue;
                            },
                            function (newVal, oldVal) {

                                if (newVal !== oldVal) {

                                    parseLocationSearch(newVal);
                                }
                            }
                        );

                        //Change Model on location change start
                        scope.$on('$locationChangeStart', function(event, newUrl, oldUrl, newState, oldState) {

                            changeModel($location.search());
                        });

                        //Init Model
                        changeModel($location.search());
                    }


                    /**
                     * Evaluate location search attribute if is form
                     */
                    if (formCtrl) {

                        //Event Submit Form
                        elem.on('submit', function() {
                            var submit = scope.$eval(attrs.ngSubmit);

                            if (submit) {
                                parseLocationSearch(submit);
                            }
                        });

                        //Change Form on location change start
                        scope.$on('$locationChangeStart', function(event, newUrl, oldUrl, newState, oldState) {

                            changeForm($location.search());
                        });

                        //Init Form
                        changeForm($location.search());
                    }

                }

                /**
                 * Destroy
                 */
                scope.$on('$destroy', function handleDestroyEvent() {
                        if ( angular.isDefined(scope[attrs.ngSubmit]) ) {
                            delete scope[attrs.ngSubmit];
                        }
                    }
                );
            }

        };
    }]);

})(window.angular);