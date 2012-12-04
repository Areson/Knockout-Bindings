(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD anonymous module
        define(["knockout"], factory);
    } else {
        // No module loader (plain <script> tag) - put directly in global namespace
        factory(window.ko);
    }
})(function(ko){
	function CleanupBinding() {
		this.bindings = {};
	}

	CleanupBinding.prototype.register = function(name, binding) {
		this.bindings[name] = binding;
	}

	CleanupBinding.prototype.unregister = function(name) {
		delete this.bindings[name];
	}

	var fetchInternal = function(name, binding) {
		var results = new Array();
		var tokens = name.split(",");

		for(var i = 0; i < tokens.length; i++) {
			var tempBinding = binding[tokens[i]];

			if(!tempBinding) {
				throw "The binding '" + tokens[i] + "' is not registered.";
			}

			results.push(tempBinding);
		}

		return results;
	}

	CleanupBinding.prototype.fetch = function(name) {
		return fetchInternal(name, this.bindings);
	}

	var cleanupBinding = new CleanupBinding();

	ko.bindingHandlers.cleanup = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var binding = valueAccessor() || {};
            var name = null;
            var contextFilter = null
            var originalContext = bindingContext;

            // Parse shorthand notation [binding, binding name, context filter]
            if(binding instanceof Array) {
            	if(typeof binding[0] === 'string') {
            		// We are getting a registered binding
            		contextFilter = binding[1];
            		binding = cleanupBinding.fetch(binding[0]);
            	}
            	else if(typeof binding[0] === 'object') {
            		// The user is passing a binding
            		name = binding[1];
	            	contextFilter = binding[2];
	            	binding = binding[0];

	            	if(name && name.length > 0) {
	            		binding = fetchInternal(name, binding);

	            		if(!binding) {
	            			throw "The binding '" + name + "' does not exist.";
	            		}
	            	}
	            	else {
	            		binding = [binding];
	            	}
            	}
            	else {
            		throw "Unknown parameter passed as a binding: " + binding[0];
            	}            	
            } 



            // Setup the context for the bindings
            var finalContext = new Array();

            if(contextFilter && contextFilter.length > 0) {
            	var tokens = contextFilter.split(",");

            	for(var i = 0; i < tokens.length; i++) {
            		var filters = tokens[i].split(".");

            		var context = originalContext;

            		for(var j = 0; j < filters.length; j++) {
            			context = context[filters[j]];
            		}

            		finalContext.push(context);
            	}
            }

            // Assemble the final binding
            var finalBinding = {};

            for(var i = 0; i < binding.length; i++) {
            	if(typeof binding[i] === 'function') {
            		binding[i] = binding[i].call(viewModel, finalContext[i] || originalContext);
            	}

            	for(bind in binding[i]) {
            		if(finalBinding[bind]) {
            			throw "You cannot use the binding '" + bind + "' twice on the same element.";
            		}
            		else {
            			finalBinding[bind] = binding[i][bind];
            		}
            	}
            }

            // Apply the bindings and return
            var bind = ko.applyBindingsToNode(element, finalBinding, originalContext);

            return { controlsDescendantBindings: !bind.shouldBindDescendants };
        }
    };
});