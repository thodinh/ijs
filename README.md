# ijs-server

# Overview

The generic server daemon and supports a component plug-in system built-in with basic functions such as configuration file loading, command-line argument parsing, logging, and more.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install ijs-server
```

Then use `require()` to load it in your code:

```javascript
var IJSServer = require('ijs-server');
```

Then instantiate a server object and start it up:

```javascript
var server = new IJSServer({
	
	$_name: 'IJSServer',
    $_version : "1.0",
	
	configFile: __dirname + '/conf/config.json',
	components: []
	
});

server.startup( function() {
	// It's work!
} );
```

Of course, this example won't actually do anything useful, because the server has no components.  Let's add a web server component to our server, just to show how it works:

```javascript
var IJSServer = require('ijs-server');

var server = new IJSServer({
	
	$_name: 'IJSServer',
	$_version: "1.0",
	
	config: {
		"log_dir": "./log",
		"debug_level": 9,
		
		"ExpressServer": {
			"port": 80,
			"dir": "./html"
		}
	},
	
	components: [
		require('./components/ijs-express')
	]
	
});
server.startup( function() {
	// startup complete
} );
```

# Configuration

```javascript
{
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www"
	}
}
```

Or it can be saved in JSON file, and specified using the `configFile` property like this:

```javascript
{
	configFile: "conf/config.yaml|json"
}
```

Here are the global configuration keys:

| Config Key | Default Value | Description |
|------------|---------------|-------------|
| `debug` | `false` | When set to `true`, will run directly on the console without forking a daemon process. |
| `echo` | `false` | When set to `true` and combined with `debug`, will echo all log output to the console. |
| `color` | `false` | When set to `true` and combined with `echo`, all log columns will be colored in the console. |
| `log_dir` | "." | Directory path where event log will be stored. |
| `log_filename` | "event.log" | Event log filename, joined with `log_dir`. |
| `log_columns` | [Array] | Custom event log columns, if desired (see [Logging](#logging) below). |
| `log_crashes` | `false` | When set to `true`, will log all uncaught exceptions to a `crash.log` file in the `log_dir` dir. |
| `log_async` | `false` | When set to `true`, all log entries will be written in async mode (i.e. in the background). |
| `uid` | `null` | If set and running as root, forked daemon process will attempt to switch to the specified user (numerical ID or a username string). |
| `pid_file` | - | Optionally set a PID file, that is created on startup and deleted on shutdown. |
| `debug_level` | `1` | Debug logging level, larger numbers are more verbose, 1 is quietest, 10 is loudest. |
| `inject_cli_args` | - | Optionally inject Node.js command-line arguments into forked daemon process, e.g. `["--max_old_space_size=4096"]`. |
| `log_debug_errors` | `false` | Optionally log all debug level 1 events as errors with `fatal` code.  Helps for visibility with log alerting systems. |

Remember that each component should have its own configuration key.  Here is an example server configuration, including the `WebServer` component:

```javascript
{
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www",
		
		"WebServer": {
			"http_port": 80,
			"http_htdocs_dir": "/var/www/html"
		}
	}
}
```

Consult the documentation for each component you use to see which keys they require.

## Command-Line Arguments

You can specify command-line arguments when launching your server.  If these are in the form of `--key value` they will override any global configuration keys with matching names.  For example, you can launch your server in debug mode and enable log echo like this:

```
node my-script.js --debug 1 --echo 1
```

Actually, you can set a configuration key to boolean `true` simply by including it without a value, so this works too:

```
node my-script.js --debug --echo
```

### Optional Echo Categories

If you want to limit the log echo to certain log categories or components, you can specify them on the command-line, like this:

```
node my-script.js --debug 1 --echo "debug error"
```

This would limit the log echo to entries that had their `category` or `component` column set to either `debug` or `error`.  Other non-matched entries would still be logged -- they just wouldn't be echoed to the console.


**Note:** The `configFile` and `multiConfig` server properties are mutually exclusive.  If you specify `configFile`  it takes precedence, and disables the multi-config system.

# Logging

This module is a combination of a debug log, error log and transaction log, with a `category` column denoting the type of log entry.  By default, the log columns are defined as:

```javascript
['hires_epoch', 'date', 'hostname', 'component', 'category', 'code', 'msg', 'data']
```

However, you can override these and provide your own array of log columns by specifying a `log_columns` configuration key.

Here is an example debug log snippet:

```
[1591160814.389][2020-06-03 12:06:54][itsg5-pc][752][IJS][debug][2][IJS v1.0 Starting Up][{"pid":752,"ppid":6692,"node":"v12.17.0","arch":"x64","platform":"win32","argv":["C:\\Program Files\\nodejs\\node.exe","D:\\code\\ijs\\index.js"],"execArgv":[]}]
[1591160814.415][2020-06-03 12:06:54][itsg5-pc][752][IJS][debug][2][Server IP: 192.168.1.51, Daemon PID: 752][]
[1591160814.423][2020-06-03 12:06:54][itsg5-pc][752][IJS][debug][2][Startup complete, entering main loop][]
Hello
[1591161114.449][2020-06-03 12:11:54][itsg5-pc][752][IJS][debug][2][Caught SIGINT][]
[1591161114.457][2020-06-03 12:11:54][itsg5-pc][752][IJS][debug][2][Shutting down][]
[1591161114.466][2020-06-03 12:11:54][itsg5-pc][752][IJS][debug][2][Shutdown complete, exiting][]
```

For debug log entries, the `category` column is set to `debug`, and the `code` columns is used as the debug level.  The server object (and your component object) has methods for logging debug messages, errors and transactions:

```javascript
server.logDebug( 9, "This would be logged at level 9 or higher." );
server.logError( 1005, "Error message for code 1005 here." );
server.logTransaction( 99.99, "Description of transaction here." );
```

These three methods all accept two required arguments, and an optional 3rd "data" object, which is serialized and logged into its own column if provided.  For the debug log, the first argument is the debug level.  Otherwise, it is considered a "code" (can be used however your app wants).

When you call `logDebug()`, `logError()` or `logTransaction()` on your component object, the `component` column will be set to the component name.  Otherwise, it will be blank (including when the server logs its own debug messages).

If you need low-level, direct access to the `Logger` object, you can call it by accessing the `logger` property of the server object or your component class.  Example:

```javascript
server.logger.print({ 
	category: 'custom', 
	code: 'custom code', 
	msg: "Custom message here", 
	data: { text: "Will be serialized to JSON" } 
});
```

The server and component classes have a utility method named `debugLevel()`, which accepts a log level integer, and will return `true` if the current debug log level is high enough to emit something at the specified level, or `false` if it would be silenced.

# Component Development

To develop your own component, create a class that inherits from the `ijs-server/component` base class.    Set your `$_name` property to a unique, alphanumeric name, which will be your Component ID.  This is how other components can reference yours from the `server` object, and this is the key used for your component's configuration as well.

Here is a simple component example:

```javascript
var Component = require("ijs-server/component");

module.exports = class MyComponent extends Component {
	constructor() {
		super(...arguments)
		this.$_name: 'MyComponent'
		this.$_parent: Component
	}
	
	async startup() {
		this.logDebug(1, "My component is starting up!");
	}
	
	async shutdown () {
		this.logDebug(1, "My component is shutting down!");
	}
	
};
```

Now, assuming you saved this class as `my_component.js`, you would load it in a server by adding it to the `components` array like this:

```javascript
components: [
	require('./my_component.js')
]
```

This would load the `ijs-express` component first, followed by your `my_component.js` component after it.  Remember that the load order is important, if you have a component that relies on another.

Your component's configuration would be keyed off the value in your `$_name` property, like this:

```javascript
{
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www",
		
		"IJSServer": {
			"port": 80
		},
		
		"MyComponent": {
			"key1": "Value 1",
			"key2": "Value 2"
		}
	}
}
```

If you want to specify default configuration keys (in case they are missing from the server configuration for your component), you can define a `defaultConfig` property in your class, like this:

```javascript
module.exports = class MyComponent {
	$_name: 'MyComponent',
	$_parent: Component,
	
	defaultConfig: {
		"key1": "Default Value 1",
		"key2": "Default Value 2"
	}
});
```

## Startup and Shutdown

Your component should at least provide `startup()` and `shutdown()` methods.  These are both async methods, which should invoke the provided callback function when they are complete.  Example:

```javascript
{
	async startup () {
		this.logDebug(1, "My component is starting up!");
	}
	
	async shutdown () {
		this.logDebug(1, "My component is shutting down!");
	}
}
```

As with all Node.js callbacks, if something goes wrong and you want to abort the startup or shutdown routines, pass an `Error` object to the callback method.

## Accessing Your Configuration

Your configuration object is always accessible via `this.config`.  Note that this is an instance of `Config`, so you need to call `get()` on it to fetch individual configuration keys, or you can fetch the entire object by calling it without an argument:

```javascript
{
	async startup () {
		this.logDebug(1, "My component is starting up!");
		
		// access our component configuration
		var key1 = this.config.get('key1');
		var entire_config = this.config.get();
	}
}
```

If the server configuration is live-reloaded due to a changed file, your component's `config` object will emit a `reload` event, which you can listen for.

## Accessing The Root Server

Your component can always access the root server object via `this.server`.  Example:

```javascript
{
	startup: function(callback) {
		this.logDebug(1, "My component is starting up!");
		
		// access the main server configuration
		var server_uid = this.server.config.get('uid');
		
		callback();
	}
}
```

## Accessing Other Components

Other components are accessible via `this.server.COMPONENT_NAME`.  Please be aware of the component load order, as components listed below yours in the server `components` array won't be fully loaded when your `startup()` method is called.  Example:

```javascript
{
	async startup() {
		this.logDebug(1, "My component is starting up!");
		
		// access the IJSExpress component
		this.server.IJSExpress.get('/my/custom/uri', function(req, res) {
			res.send('OK')
		} );
		
	}
}
```

## Accessing The Server Log

Your component's base class has convenience methods for logging debug messages, errors and transactions via the `logDebug()`, `logError()` and `logTransaction()` methods, respectively.  These log messages will all be tagged with your component name, to differentiate them from other components and generic server messages.  Example:

```javascript
this.logDebug( 9, "This would be logged at level 9 or higher." );
this.logError( 1005, "Error message for code 1005 here." );
this.logTransaction( 99.99, "Description of transaction here." );
```

If you need low-level, direct access to the `Logger` object, you can call it by accessing the `logger` property of your component class.  Example:

```javascript
this.logger.print({ 
	category: 'custom', 
	code: 'custom code', 
	msg: "Custom message here", 
	data: { text: "Will be serialized to JSON" } 
});
```